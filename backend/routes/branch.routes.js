import express from 'express';
import Branch from '../models/branch.model.js';

const router = express.Router();

// Get all branches
router.get('/branches', async (req, res) => {
    try {
        const branches = await Branch.find();
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;