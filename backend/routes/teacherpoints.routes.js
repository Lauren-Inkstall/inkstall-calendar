import express from 'express';
import { 
  getTeacherPointsForCurrentMonth, 
  getAllTeacherPoints,
  awardPointsManually
} from '../controllers/teacherpoints.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current teacher's points for current month
router.get('/', auth, getTeacherPointsForCurrentMonth);

// Get all teachers' points (admin only)
router.get('/all', auth, getAllTeacherPoints);

// Test endpoint to manually award points (for testing with Postman)
router.post('/award', auth, awardPointsManually);

export default router;
