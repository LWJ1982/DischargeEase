// routes/serviceBooking.js
const express = require('express');
const router = express.Router();
const { ServiceBooking, Service, User, PatientRecord, Notification } = require('../models');
const { validateToken } = require("../middlewares/auth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for home assessment photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads/home-assessment');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only!'));
        }
    }
});

// Get all services
router.get('/services', validateToken, async (req, res) => {
    try {
        const services = await Service.findAll();
        return res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Create a new service
router.post('/services', validateToken, async (req, res) => {
    try {
        // Only admin can create services
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can create services'
            });
        }

        const { service_name, description } = req.body;
        const newService = await Service.create({
            service_name,
            description
        });

        return res.status(201).json({
            success: true,
            data: newService,
            message: 'Service created successfully'
        });
    } catch (error) {
        console.error('Error creating service:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get all bookings for a specific patient
router.get('/patient/:patientId', validateToken, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Check authorization (patient's own bookings, or medical staff)
        if (
            req.user.id !== parseInt(patientId) && 
            !['doctor', 'nurse', 'admin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view these service bookings'
            });
        }

        const bookings = await ServiceBooking.findAll({
            where: { patient_id: patientId },
            include: [
                {
                    model: Service,
                    as: 'Service',
                    attributes: ['id', 'service_name', 'description']
                },
                {
                    model: User,
                    as: 'nurse',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ],
            order: [['schedule_time', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching patient bookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get all service bookings assigned to a nurse
router.get('/nurse/:nurseId', validateToken, async (req, res) => {
    try {
        const { nurseId } = req.params;
        
        // Check authorization (nurse's own assignments, or admin/doctor)
        if (
            req.user.id !== parseInt(nurseId) && 
            !['doctor', 'admin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view these nurse assignments'
            });
        }

        const bookings = await ServiceBooking.findAll({
            where: { nurse_id: nurseId },
            include: [
                {
                    model: Service,
                    as: 'Service',
                    attributes: ['id', 'service_name', 'description']
                },
                {
                    model: PatientRecord,
                    as: 'Patient',
                    attributes: ['id', 'name', 'ward']
                }
            ],
            order: [['schedule_time', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching nurse assignments:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Create a new service booking (for doctors to assign services)
router.post('/', validateToken, async (req, res) => {
    try {
        // Only doctors can create service bookings
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can create service bookings'
            });
        }

        const { patient_id, service_id, nurse_id, schedule_time } = req.body;

        // Validate the patient exists
        const patient = await PatientRecord.findByPk(patient_id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Validate the service exists
        const service = await Service.findByPk(service_id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // If nurse_id is provided, validate the nurse exists and is a nurse
        if (nurse_id) {
            const nurse = await User.findByPk(nurse_id);
            if (!nurse || nurse.role !== 'nurse') {
                return res.status(404).json({
                    success: false,
                    message: 'Valid nurse not found'
                });
            }
        }

        // Auto-scheduling logic if nurse has existing bookings for this patient
        let finalScheduleTime = new Date(schedule_time);

        if (nurse_id) {
            // Check for existing bookings for the same patient with this nurse
            const existingBookings = await ServiceBooking.findAll({
                where: {
                    patient_id,
                    nurse_id,
                    status: {
                        [sequelize.Op.in]: ['Pending', 'Scheduled']
                    }
                },
                order: [['schedule_time', 'DESC']]
            });

            // If there are existing bookings, schedule this one right after the last one
            if (existingBookings.length > 0) {
                const lastBooking = existingBookings[0];
                // Add 30 minutes to the last booking time for the new booking
                finalScheduleTime = new Date(new Date(lastBooking.schedule_time).getTime() + 30 * 60000);
            }
        }

        // Create the booking
        const newBooking = await ServiceBooking.create({
            patient_id,
            service_id,
            nurse_id,
            schedule_time: finalScheduleTime,
            status: 'Scheduled'
        });

        // Send notification to the nurse if assigned
        if (nurse_id) {
            await Notification.create({
                recipient_id: nurse_id,
                message: `You have been assigned a new ${service.service_name} service for patient ${patient.name} at ${finalScheduleTime.toLocaleString()}`,
                timestamp: new Date()
            });
        }

        return res.status(201).json({
            success: true,
            data: newBooking,
            message: 'Service booking created successfully'
        });
    } catch (error) {
        console.error('Error creating service booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update service booking status
router.put('/:bookingId', validateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        
        // Check authorization (only nurses and doctors can update status)
        if (!['nurse', 'doctor', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update booking status'
            });
        }

        // Validate status value
        const validStatuses = ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // Find the booking
        const booking = await ServiceBooking.findByPk(bookingId, {
            include: [
                {
                    model: PatientRecord,
                    as: 'Patient',
                    attributes: ['id', 'name']
                },
                {
                    model: Service,
                    as: 'Service',
                    attributes: ['id', 'service_name']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user is the assigned nurse for this booking
        if (
            req.user.role === 'nurse' && 
            booking.nurse_id !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this booking'
            });
        }

        // Update the booking
        await booking.update({ status });

        // Send notification to patient when service status changes
        await Notification.create({
            recipient_id: booking.patient_id,
            message: `Your ${booking.Service.service_name} service has been updated to ${status}`,
            timestamp: new Date()
        });

        return res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking status updated successfully'
        });
    } catch (error) {
        console.error('Error updating service booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Assign a nurse to a booking
router.put('/:bookingId/assign', validateToken, async (req, res) => {
    try {
        // Only doctors or admins can assign nurses
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can assign nurses to bookings'
            });
        }

        const { bookingId } = req.params;
        const { nurse_id } = req.body;

        // Validate the nurse exists and is actually a nurse
        const nurse = await User.findByPk(nurse_id);
        if (!nurse || nurse.role !== 'nurse') {
            return res.status(404).json({
                success: false,
                message: 'Valid nurse not found'
            });
        }

        // Find the booking
        const booking = await ServiceBooking.findByPk(bookingId, {
            include: [
                {
                    model: PatientRecord,
                    as: 'Patient',
                    attributes: ['id', 'name']
                },
                {
                    model: Service,
                    as: 'Service',
                    attributes: ['id', 'service_name']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update the booking with the nurse assignment
        await booking.update({ 
            nurse_id,
            status: 'Scheduled' // Update status to scheduled once a nurse is assigned
        });

        // Send notification to the assigned nurse
        await Notification.create({
            recipient_id: nurse_id,
            message: `You have been assigned a ${booking.Service.service_name} service for patient ${booking.Patient.name} at ${new Date(booking.schedule_time).toLocaleString()}`,
            timestamp: new Date()
        });

        return res.status(200).json({
            success: true,
            data: booking,
            message: 'nurse assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning nurse:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Upload home environment photos for assessment
router.post('/:bookingId/home-photos', validateToken, upload.array('photos', 10), async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Find the booking
        const booking = await ServiceBooking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check authorization (patient or caregiver can upload)
        const patient = await PatientRecord.findByPk(booking.patient_id);
        if (
            req.user.id !== patient.patient_id && 
            req.user.role !== 'caregiver'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to upload home photos'
            });
        }

        // Process uploaded files
        const photoUrls = req.files.map(file => `/uploads/home-assessment/${file.filename}`);

        // Store the photos in the booking metadata (we'll need to add a metadata JSON field to the model)
        let metadata = booking.metadata || {};
        metadata.homePhotos = [...(metadata.homePhotos || []), ...photoUrls];
        
        await booking.update({ metadata });

        // Notify the nurse if one is assigned
        if (booking.nurse_id) {
            await Notification.create({
                recipient_id: booking.nurse_id,
                message: `New home environment photos have been uploaded for your booking #${bookingId}`,
                timestamp: new Date()
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                bookingId,
                uploadedPhotos: photoUrls
            },
            message: 'Home photos uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading home photos:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Upload medication information for discharge counseling
router.post('/:bookingId/medication-info', validateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { medications } = req.body;
        
        // Find the booking
        const booking = await ServiceBooking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check authorization (patient, caregiver, or medical staff)
        const patient = await PatientRecord.findByPk(booking.patient_id);
        if (
            req.user.id !== patient.patient_id && 
            !['doctor', 'nurse', 'caregiver'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to upload medication information'
            });
        }

        // Store the medication info in the booking metadata
        let metadata = booking.metadata || {};
        metadata.medications = medications;
        
        await booking.update({ metadata });

        // Notify the nurse if one is assigned
        if (booking.nurse_id) {
            await Notification.create({
                recipient_id: booking.nurse_id,
                message: `Medication information has been updated for your booking #${bookingId}`,
                timestamp: new Date()
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                bookingId,
                medications
            },
            message: 'Medication information saved successfully'
        });
    } catch (error) {
        console.error('Error saving medication information:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get service history for a patient
router.get('/history/:patientId', validateToken, async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Check authorization (patient's own history, or medical staff)
        const patient = await PatientRecord.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        if (
            req.user.id !== patient.patient_id && 
            !['doctor', 'nurse', 'admin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view service history'
            });
        }

        // Get all completed service bookings
        const serviceHistory = await ServiceBooking.findAll({
            where: { 
                patient_id: patientId,
                status: 'Completed' 
            },
            include: [
                {
                    model: Service,
                    as: 'Service',
                    attributes: ['id', 'service_name', 'description']
                },
                {
                    model: User,
                    as: 'nurse',
                    attributes: ['id', 'name', 'role']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: serviceHistory
        });
    } catch (error) {
        console.error('Error fetching service history:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;