// routes/medicalRecords.js
const express = require('express');
const router = express.Router();
const { PatientRecord, Erratum, User } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const yup = require('yup');
const { validateToken } = require("../middlewares/auth");

const createPatientRecordSchema = yup.object({
    patient_id: yup
        .number()
        .integer()
        .required('patient_id is required'),
    ward: yup.string().max(50).nullable(),
    medical_history: yup.string().nullable(),
    drawings: yup.array().of(yup.string()).nullable(),
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads/attachments');
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

// Get all patient records (for doctors and nurses)
router.get('/', validateToken, async (req, res) => {
    try {
        // Only allow doctors, nurses, and admins to see all records
        if (!['doctor', 'nurse', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view all patient records'
            });
        }

        const records = await PatientRecord.findAll({
            include: [
                {
                    model: User,
                    as: 'Patient',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('Error fetching patient records:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get a single patient record by ID
router.get('/:id', validateToken, async (req, res) => {
    try {
        const record = await PatientRecord.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'Patient',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Erratum,
                    as: 'Errata',
                    include: [
                        {
                            model: User,
                            as: 'SubmittedBy',
                            attributes: ['id', 'name', 'role']
                        }
                    ]
                }
            ]
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found'
            });
        }

        // Check if user has access rights (patient themselves, or medical staff)
        if (
            req.user.id !== record.patient_id &&
            !['doctor', 'nurse', 'admin'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view this patient record'
            });
        }

        return res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error('Error fetching patient record:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Create a new patient record (Doctors only)
router.post('/', validateToken, async (req, res) => {
    try {
        // Only doctors can create records
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can create medical records'
            });
        }

        // // Validate input data
        await createPatientRecordSchema.validate(req.body, { abortEarly: false });

        const { patient_id, name, ward, medical_history } = req.body;

        // Validate patient_id is a number
        const parsedPatientId = parseInt(patient_id, 10);
        if (isNaN(parsedPatientId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid patient_id'
            });
        }

        // Confirm patient exists
        const patient = await User.findByPk(parsedPatientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: `Patient not found with ID: ${parsedPatientId}`
            });
        }

        // Verify that the user has the 'patient' role
        if (patient.role !== 'patient') {
            return res.status(400).json({
                success: false,
                message: `Cannot create a medical record for a user with role: ${patient.role}. Only users with 'patient' role can have medical records.`
            });
        }

        // Create the record
        const newRecord = await PatientRecord.create({
            patient_id: parsedPatientId,
            name: patient.name, // Fixed from User
            ward,
            medical_history,
            drawings: null, // Initialize as empty array
            created_by: req.user.id,
            created_at: new Date()
        });

        return res.status(201).json({
            success: true,
            data: newRecord,
            message: 'Patient record created successfully'
        });
    } catch (error) {
        console.error('Error creating patient record:', error);
    
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'A medical record already exists for this patient',
            });
        }
    
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update medical record with new drawings
router.put('/:id/drawings', validateToken, upload.array('drawings', 5), async (req, res) => {
    try {
        // Doctors or nurses can update records
        if (!['doctor', 'nurse'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only medical staff can update records'
            });
        }

        const recordId = req.params.id;
        const record = await PatientRecord.findByPk(recordId);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found'
            });
        }

        // Process uploaded files
        const fileUrls = req.files.map(file => `/uploads/attachments/${file.filename}`);

        // Update drawings in the record
        const currentDrawings = record.drawings || [];
        const updateDrawings = [...currentDrawings, ...fileUrls];

        await record.update({
            drawings: updateDrawings
        });

        return res.status(200).json({
            success: true,
            data: record,
            message: 'Drawings added to patient record'
        });
    } catch (error) {
        console.error('Error updating patient record drawings:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Add an erratum to a patient record
router.post('/:id/erratum', validateToken, async (req, res) => {
    try {
        // Only doctors can submit errata
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can submit error corrections'
            });
        }

        const { correction_details } = req.body;
        const patient_id = req.params.id;

        // Verify the patient record exists
        const record = await PatientRecord.findByPk(patient_id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found'
            });
        }

        // Create erratum
        const erratum = await Erratum.create({
            patient_id,
            submitted_by: req.user.id,
            correction_details,
            timestamp: new Date()
        });

        return res.status(201).json({
            success: true,
            data: erratum,
            message: 'Erratum filed successfully'
        });
    } catch (error) {
        console.error('Error filing erratum:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get all errata for a patient record
router.get('/:id/errata', validateToken, async (req, res) => {
    try {
        // Check authorization
        if (!['Doctor', 'nurse', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view errata'
            });
        }

        const patient_id = req.params.id;

        // Verify the patient record exists
        const record = await PatientRecord.findByPk(patient_id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found'
            });
        }

        // Get all errata
        const errata = await Erratum.findAll({
            where: { patient_id },
            include: [
                {
                    model: User,
                    as: 'SubmittedBy',
                    attributes: ['id', 'name', 'role']
                }
            ],
            order: [['timestamp', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: errata
        });
    } catch (error) {
        console.error('Error fetching errata:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;