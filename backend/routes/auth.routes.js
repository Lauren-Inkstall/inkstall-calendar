import express from 'express';
import { auth, authorize } from '../middleware/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import * as teacherController from '../controllers/teacher.controller.js';

const router = express.Router();

// Public routes
router.post('/init-superadmin', authController.initSuperAdmin);
router.post('/login', authController.login);

// Protected routes
router.post('/users', auth, authorize('superadmin', 'admin'), authController.createUser);
router.get('/teachers', auth, authorize('superadmin', 'admin'), authController.getAllTeachers);
router.get('/users/:id/teacher-profile', auth, teacherController.getTeacherProfile);

export default router;