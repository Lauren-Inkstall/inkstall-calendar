// subjects.routes.js
import express from 'express';
import Subject from '../models/subjects.model.js';

const router = express.Router();

router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({}, { name: 1, _id: 0 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
