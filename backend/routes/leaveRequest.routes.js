import express from 'express';
import LeaveRequest from '../models/leaveRequest.model.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Submit a leave request
router.post('/submit', auth, async (req, res) => {
    try {
        const leaveRequest = new LeaveRequest({
            teacherId: req.user._id,
            teacherName: req.body.teacherName,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            reasonForLeave: req.body.reasonForLeave
        });
        
        await leaveRequest.save();
        res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting leave request', error: error.message });
    }
});

// Get teacher's own requests
router.get('/my-requests', auth, async (req, res) => {
    try {
        const leaveRequests = await LeaveRequest.find({ teacherId: req.user._id });
        res.json(leaveRequests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
    }
});

// Get all leave requests (admin and super-admin only)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const leaveRequests = await LeaveRequest.find();
        res.json(leaveRequests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
    }
});

// Update leave request status (admin and super-admin only)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { status, leaveType } = req.body;
        
        // Validate status
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Validate leaveType if status is approved
        if (status === 'approved' && !['paid', 'unpaid'].includes(leaveType)) {
            return res.status(400).json({ message: 'Leave type must be specified as paid or unpaid when approving' });
        }

        const updateData = {
            status,
            updatedAt: Date.now()
        };

        // Only set leaveType if status is approved
        if (status === 'approved') {
            updateData.leaveType = leaveType;
        }

        const leaveRequest = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        res.json(leaveRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave request', error: error.message });
    }
});

export default router;