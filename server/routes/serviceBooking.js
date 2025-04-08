// routes/serviceBooking.js
const express = require('express');
const router = express.Router();
const { ServiceBooking, Service, User, PatientRecord, Notification } = require('../models');
const { validateToken } = require("../middlewares/auth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const yup = require('yup');
const { Sequelize, Op } = require('sequelize');

//Prefixed so yup validation removed
// const serviceSchema = yup.object().shape({
//     service_name: yup
//         .string()
//         .required('Service name is required')
//         .lowercase()
//         .oneOf([
//             'discharge medication counselling',
//             'caregiver training',
//             'home assessment'
//         ], 'Services must be one of the following: Discharge Medication Counselling',
//             'Caregiver Training',
//             'Home Assessment'),
//     description: yup
//         .string()
//         .required('Description is required')
// });


const serviceBookingSchema = yup.object().shape({
    status: yup
        .string()
        .required('Status is required, Default is "pending"')
        .lowercase()
        .oneOf([
            'pending', 'scheduled', 'in progress', 'completed', 'cancelled'
        ], 'Status must be one of the following: pending,',
            'scheduled, in progress, completed, cancelled'),
});


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
        // Check authorization
        if (!['doctor', 'nurse', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view services'
            });
        }

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

// // for future use, to create services
// router.post('/services', validateToken, async (req, res) => {
//     try {
//        // Only admin can create services
// if (req.user.role !== 'Admin') {
//     return res.status(403).json({
//         success: false,
//         message: 'Only administrators can create services'
//     });
// }

//         const { service_name, description } = req.body;
//         const newService = await Service.create({
//             service_name,
//             description
//         });

//         return res.status(201).json({
//             success: true,
//             data: newService,
//             message: 'Service created successfully'
//         });
//     } catch (error) {
//         console.error('Error creating service:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         });
//     }
// });

// Get all bookings for a specific patient
router.get('/patient/:patientId', validateToken, async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if the patient exists
        const patientRecord = await PatientRecord.findByPk(patientId);
        if (!patientRecord) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

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

        // Get patient details along with their service bookings
        const patientWithBookings = await PatientRecord.findByPk(patientId, {
            include: [
                {
                    model: ServiceBooking,
                    as: 'ServiceBookings',
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
                    ]
                }
            ]
        });

        // If you want to separate the patient data from bookings
        return res.status(200).json({
            success: true,
            patient: {
                id: patientWithBookings.id,
                name: patientWithBookings.name,
                ward: patientWithBookings.ward,
                // Include other patient fields as needed
            },
            data: patientWithBookings.ServiceBookings || []
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
        //For this project only nurses can view their own assignments,
        // tagging done in the association
        //For future use, to allow all parties to view the bookings
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
                    as: 'patient',
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

// Create a new auto assign service booking (for doctors to assign services)
//The patient_id here is the id in the patient record, not the patient id in the patient record
//Only need 2 input Patient ID and Service ID, the rest are auto assigned
//The patient name is optional, if not provided, the name from the patient record will be used

router.post('/', validateToken, async (req, res) => {
    try {
        // Only doctors can create service bookings
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can create service bookings'
            });
        }

        const { patient_id, patient_name, service_id, schedule_time } = req.body;

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

        // Replace the existing auto-scheduling logic with this improved version
        // that ensures even distribution of patients among nurses

        // Auto-scheduling logic to assign a nurse
        let nurse = null;
        let finalScheduleTime = new Date(schedule_time);

        // Find all nurses
        const allNurses = await User.findAll({
            where: {
                role: 'nurse'
            },
            attributes: ['id', 'name', 'role']
        });

        if (allNurses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No available nurses to assign'
            });
        }

        // Get the current booking count for each nurse
        const activeStatuses = ['pending', 'scheduled', 'in progress'];
        const nurseBookingCounts = {};

        // Initialize all nurses with 0 bookings
        allNurses.forEach(nurse => {
            nurseBookingCounts[nurse.id] = 0;
        });

        // Get current booking counts
        const existingBookings = await ServiceBooking.findAll({
            where: {
                status: {
                    [Op.in]: activeStatuses
                }
            },
            attributes: ['nurse_id'],
            raw: true
        });

        // Count bookings for each nurse
        existingBookings.forEach(booking => {
            if (booking.nurse_id && nurseBookingCounts[booking.nurse_id] !== undefined) {
                nurseBookingCounts[booking.nurse_id]++;
            }
        });

        // Find the nurse with the minimum number of bookings
        let minBookings = Number.MAX_SAFE_INTEGER;
        let nursesWithMinBookings = [];

        Object.keys(nurseBookingCounts).forEach(nurseId => {
            const bookingCount = nurseBookingCounts[nurseId];

            if (bookingCount < minBookings) {
                minBookings = bookingCount;
                nursesWithMinBookings = [nurseId];
            } else if (bookingCount === minBookings) {
                nursesWithMinBookings.push(nurseId);
            }
        });

        // If there are multiple nurses with the same minimum count, randomly choose one
        const selectedNurseId = nursesWithMinBookings[Math.floor(Math.random() * nursesWithMinBookings.length)];
        nurse = allNurses.find(n => n.id == selectedNurseId);

        // Auto-scheduling logic if nurse has existing bookings for this patient
        if (nurse.id) {
            // Check for existing bookings for the same patient with this nurse
            const existingPatientBookings = await ServiceBooking.findAll({
                where: {
                    patient_id,
                    nurse_id: nurse.id,
                    status: {
                        [Op.in]: activeStatuses
                    }
                },
                order: [['schedule_time', 'DESC']]
            });

            // If there are existing bookings, schedule this one right after the last one
            if (existingPatientBookings.length > 0) {
                const lastBooking = existingPatientBookings[0];
                // Add 30 minutes to the last booking time for the new booking
                finalScheduleTime = new Date(new Date(lastBooking.schedule_time).getTime() + 30 * 60000);
            }
        }
        // Use patient name from request if provided, otherwise use the name from patient record
        const patientName = patient_name || patient.name;

        // Create the booking
        const newBooking = await ServiceBooking.create({
            patient_id,
            patient_name: patientName, // Include patient name in the booking
            service_id,
            nurse_id: nurse.id,
            nurse_name: nurse.name, // Include nurse name in the booking
            schedule_time: finalScheduleTime,
            status: 'scheduled'
        });

        // Send notification to the assigned nurse
        await Notification.create({
            recipient_id: nurse.id,
            message: `You have been assigned a new ${service.service_name} service for patient ${patientName} at ${finalScheduleTime.toLocaleString()}`,
            timestamp: new Date()
        });

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

// Update service booking status in case auto assignment fails
//This is for the nurse to update the status of the booking after it has been created
//Only nurses and doctors can update the status of the booking
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
        serviceBookingSchema
        const validStatuses = ['pending', 'scheduled', 'in progress', 'completed', 'cancelled'];
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
                    as: 'patient',
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

// Assign a nurse to a booking after creation if nurse unavailable
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
            attributes: ['id', 'patient_name', 'nurse_id', 'service_id'],
            include: [
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
            status: 'scheduled' // Update status to scheduled once a nurse is assigned
        });

        // Send notification to the assigned nurse
        await Notification.create({
            recipient_id: nurse_id,
            message: `You have been assigned a ${booking.Service.service_name} service for 
            patient ${booking.patient_name} at ${new Date(booking.schedule_time).toLocaleString()}`,
            timestamp: new Date()
        });

        return res.status(200).json({
            success: true,
            data: booking,
            message: 'nurse assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning nurse:', error);

        let errorMessage = 'Server error';
        let debugInfo = null;

        // Sequelize validation or constraint error
        if (error.name === 'SequelizeValidationError') {
            errorMessage = 'Validation failed';
            debugInfo = error.errors.map(e => e.message);
        }

        // Sequelize foreign key or database constraint issue
        else if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorMessage = 'Invalid foreign key reference';
            debugInfo = {
                table: error.table,
                fields: error.fields
            };
        }

        // TypeError (e.g., trying to access property of undefined)
        else if (error instanceof TypeError) {
            errorMessage = 'Unexpected data structure. Likely null or undefined value accessed';
            debugInfo = {
                message: error.message,
                stack: error.stack.split('\n').slice(0, 2) // top of the stack for easier reading
            };
        }

        // General fallback
        else {
            debugInfo = {
                name: error.name,
                message: error.message,
                stack: error.stack.split('\n').slice(0, 2)
            };
        }
        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: debugInfo
        });
    }
});

// Upload home environment photos for assessment
//In postman, under body, form-data. key is photos, value is the file to upload
router.post('/:bookingId/home-photos', validateToken, upload.array('photos', 10), async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Find the booking
        const booking = await ServiceBooking.findByPk(bookingId, {
            include: [{
                model: Service,
                as: 'Service'
            }]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if the service is home assessment (id = 3)
        if (booking.service_id !== 3) {
            return res.status(403).json({
                success: false,
                message: 'Home photos can only be uploaded for home assessment services'
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
//Postman body example:
// {
//     "medications": [
//         {
//             "name": "Ibuprofen",
//             "dosage": "200mg",
//             "frequency": "Every 6 hours",
//             "duration": "5 days"
//         },
//         {
//             "name": "Amoxicillin",
//             "dosage": "500mg",
//             "frequency": "Three times a day",
//             "duration": "7 days"
//         }
//     ]
// }
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

        // Check if the service is discharge medication counselling (id = 1)
        if (booking.service_id !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Medications can only be for discharge medication counselling'
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
        const patientRecord = await PatientRecord.findByPk(patientId, {
            include: [{
                model: User,
                as: 'patient',
                attributes: ['id', 'name']
            }]
        });
        if (!patientRecord || !patientRecord.patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const patientName = patientRecord.patient.name;
        const patientMedicalHistory = patientRecord.medical_history;

        if (
            req.user.id !== patientRecord.patient_id &&
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

        // Prepare the response data
        const responseData = {
            patient: {
                id: patientRecord.id,
                patient_id: patientRecord.patient_id,
                name: patientName,
                ward: patientRecord.ward,
                medical_history: patientMedicalHistory
            },
            service_history: serviceHistory
        };

        return res.status(200).json({
            success: true,
            data: responseData
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