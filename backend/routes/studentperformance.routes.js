import express from 'express';
import {
    createStudentPerformance,
    getAllStudentPerformances,
    getStudentPerformanceById,
    updateStudentPerformance,
    deleteStudentPerformance
} from '../controllers/studentperformance.controller.js';

const router = express.Router();

// Routes for student performance without auth for testing
router.post('/', createStudentPerformance);
router.get('/', getAllStudentPerformances);
router.get('/:id', getStudentPerformanceById);
router.put('/:id', updateStudentPerformance);
router.delete('/:id', deleteStudentPerformance);

export default router;