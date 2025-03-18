import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import * as teacherController from '../controllers/teacher.controller.js';

const router = express.Router();

// Get all teachers
router.get('/', auth, teacherController.getAllTeachers);

// Get teacher profile
router.get('/:id', auth, teacherController.getTeacherProfile);

// Update teacher profile (including profile photo)
router.patch('/:id', auth, teacherController.updateTeacherProfile);

// Delete teacher profile
router.delete('/:id', auth, teacherController.deleteTeacherProfile);

export default router;