import express from 'express';
import { auth, authorize } from '../middleware/auth.middleware.js';
import Student from '../models/student.model.js';

const router = express.Router();

// Create new student
router.post('/', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { 
            studentName, 
            grade, 
            branch, 
            school, 
            board, 
            contactInformation,
            status,
            feeConfig,
            address,
            academicYear,
            subjects,
            feesInstallment
        } = req.body;

        // Log the request body to see if feesInstallment is being received
        console.log('Request body feesInstallment:', feesInstallment);

        // Validate required fields
        if (!studentName || !grade || !branch || !school || !board || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate contact information
        if (!Array.isArray(contactInformation) || contactInformation.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one contact is required'
            });
        }

        // Validate relation type
        for (const contact of contactInformation) {
            if (!['father', 'mother', 'guardian'].includes(contact.relation)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid relation type. Must be one of: father, mother, guardian'
                });
            }
            
            // Validate required fields in contact information
            if (!contact.number || !contact.relationName || !contact.educationQualification || 
                !contact.nameOfOrganisation || !contact.designation || !contact.Department) {
                return res.status(400).json({
                    success: false,
                    message: 'All contact information fields are required'
                });
            }
        }

        // Validate fee config
        if (!feeConfig || typeof feeConfig.basePrice !== 'number' || typeof feeConfig.totalAmount !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Fee configuration must include basePrice and totalAmount as numbers'
            });
        }

        // Generate student ID
        const studentId = await Student.generateStudentId(board, grade);

        // Create new student
        const student = new Student({
            studentId,
            studentName,
            grade,
            branch,
            school,
            board: board.toUpperCase(),
            contactInformation,
            status: status || 'admissiondue',
            feeConfig,
            address,
            academicYear,
            subjects: subjects || [],
            feesInstallment: feesInstallment || []
        });

        // Log the student object before saving to see if feesInstallment is included
        console.log('Student object before saving - feesInstallment:', student.feesInstallment);

        // Save student to database
        const savedStudent = await student.save();
        
        // Log the saved student to see if feesInstallment was saved
        console.log('Saved student - feesInstallment:', savedStudent.feesInstallment);
        
        // Format the response
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            student: {
                ...savedStudent.toObject(),
                feesInstallment: savedStudent.feesInstallment || []
            }
        });

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating student',
            error: error.message
        });
    }
});

// Get all students
router.get('/', auth, authorize('admin', 'superadmin','teacher'), async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            message: 'Students retrieved successfully',
            students
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Get student by ID
router.get('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        res.json({
            success: true,
            message: 'Student retrieved successfully',
            student
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Update student by ID
router.put('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { 
            studentName, 
            grade, 
            branch, 
            school, 
            board, 
            status,
            academicYear,
            address,
            contactInformation,
            feeConfig,
            studentPhotoUrl,
            subjects,
            feesInstallment 
        } = req.body;

        // Find student by ID
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Log the feesInstallment data for debugging
        console.log('Received feesInstallment data:', feesInstallment);

        // Validate contact information if provided
        if (contactInformation) {
            if (!Array.isArray(contactInformation) || contactInformation.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one contact is required'
                });
            }

            // Validate relation type
            for (const contact of contactInformation) {
                if (!['father', 'mother', 'guardian'].includes(contact.relation)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid relation type. Must be one of: father, mother, guardian'
                    });
                }
                
                // Validate required fields in contact information
                if (!contact.number || !contact.relationName || !contact.educationQualification || 
                    !contact.nameOfOrganisation || !contact.designation || !contact.Department) {
                    return res.status(400).json({
                        success: false,
                        message: 'All contact information fields are required'
                    });
                }
            }
        }

        // Update student fields
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    ...(studentName && { studentName }),
                    ...(grade && { grade }),
                    ...(branch && { branch }),
                    ...(school && { school }),
                    ...(board && { board: board.toUpperCase() }),
                    ...(status && { status }),
                    ...(academicYear && { academicYear }),
                    ...(address && { address }),
                    ...(contactInformation && { contactInformation }),
                    ...(feeConfig && { feeConfig }),
                    ...(studentPhotoUrl && { studentPhotoUrl }),
                    ...(subjects && { subjects }),
                    ...(feesInstallment && { feesInstallment }) 
                }
            },
            { new: true, runValidators: true }
        );

        // Log the updated student for debugging
        console.log('Updated student with feesInstallment:', updatedStudent.feesInstallment);

        res.json({
            success: true,
            message: 'Student updated successfully',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student',
            error: error.message
        });
    }
});

// Delete student by ID
router.delete('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        await Student.deleteOne({ _id: req.params.id });
        
        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message
        });
    }
});

// Add subject to student
router.post('/:id/subjects', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { name, total, startDate, endDate } = req.body;

        // Validate required fields
        if (!name || !total || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'All subject fields are required'
            });
        }

        // Find student by ID
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Add new subject
        const newSubject = {
            name,
            total,
            startDate,
            endDate
        };

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { $push: { subjects: newSubject } },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Subject added successfully',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding subject',
            error: error.message
        });
    }
});

// Update subject
router.put('/:id/subjects/:subjectId', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { name, total, startDate, endDate } = req.body;
        const { id, subjectId } = req.params;

        // Find student by ID
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Find subject index
        const subjectIndex = student.subjects.findIndex(
            subject => subject._id.toString() === subjectId
        );

        if (subjectIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Update subject fields
        if (name) student.subjects[subjectIndex].name = name;
        if (total) student.subjects[subjectIndex].total = total;
        if (startDate) student.subjects[subjectIndex].startDate = startDate;
        if (endDate) student.subjects[subjectIndex].endDate = endDate;

        await student.save();

        res.json({
            success: true,
            message: 'Subject updated successfully',
            student
        });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subject',
            error: error.message
        });
    }
});

// Delete subject
router.delete('/:id/subjects/:subjectId', auth, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id, subjectId } = req.params;

        // Find student by ID
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Remove subject
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            { $pull: { subjects: { _id: subjectId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Subject removed successfully',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error removing subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing subject',
            error: error.message
        });
    }
});

export default router;