import StudentPerformance from '../models/studentperformance.model.js';
import Student from '../models/student.model.js'; // Import the Student model

// Helper function to remove __v field from response
const removeVersionKey = (doc) => {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    const { __v, ...docWithoutVersion } = docObj;
    return docWithoutVersion;
};


export const createStudentPerformance = async (req, res) => {
    try {
        const { studentId, subject, description, testType, marks, totalMarks, submitDateTime } = req.body;

        // Check if all required fields are provided
        if (!studentId || !subject || !testType || !marks || !totalMarks || !submitDateTime) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }

        // Validate that the studentId exists in the students database
        const student = await Student.findOne({ studentId: studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Save the performance record
        const performance = new StudentPerformance({
            studentId,
            subject,
            description,
            testType,
            marks,
            totalMarks,
            submitDateTime
        });

        const savedPerformance = await performance.save();

        res.status(201).json({
            success: true,
            message: 'Student performance recorded successfully',
            data: removeVersionKey(savedPerformance)
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error recording performance', error: error.message });
    }
};

// Get all student performance records
export const getAllStudentPerformances = async (req, res) => {
    try {
        const performances = await StudentPerformance.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            message: 'Student performance records retrieved successfully',
            data: performances.map(performance => removeVersionKey(performance))
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving records', error: error.message });
    }
};

// Get a single student performance record by ID
export const getStudentPerformanceById = async (req, res) => {
    try {
        const performances = await StudentPerformance.find({ studentId: req.params.id }).sort({ submitDateTime: -1 });
        res.json({
            success: true,
            message: 'Student performance records retrieved successfully',
            data: performances.map(performance => {
              const { __v, ...rest } = performance.toObject();
              return rest;
            })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving record', error: error.message });
    }
};


// Update student performance record
export const updateStudentPerformance = async (req, res) => {
    try {
        const updatedPerformance = await StudentPerformance.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedPerformance) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        res.json({
            success: true,
            message: 'Student performance record updated successfully',
            data: removeVersionKey(updatedPerformance)
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating record', error: error.message });
    }
};

// Delete student performance record
export const deleteStudentPerformance = async (req, res) => {
    try {
        const deletedPerformance = await StudentPerformance.findByIdAndDelete(req.params.id);

        if (!deletedPerformance) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        res.json({
            success: true,
            message: 'Student performance record deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting record', error: error.message });
    }
};