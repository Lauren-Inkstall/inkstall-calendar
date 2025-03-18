import express from 'express';
import * as broadcastController from '../controllers/broadcast.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create a new broadcast (superadmin only)
router.post('/', auth, broadcastController.createBroadcast);

// Get all broadcasts
router.get('/', auth, broadcastController.getAllBroadcasts);

// Mark a broadcast as read
router.put('/:broadcastId/read', auth, broadcastController.markAsRead);

// Get unread count
router.get('/unread-count', auth, broadcastController.getUnreadCount);

export default router;