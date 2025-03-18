import express from "express";
import Grades from "../models/grades.model.js"; // Import model

const router = express.Router();

// GET API to fetch all grades
router.get("/grades", async (req, res) => {
  try {
    const results = await Grades.find();
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No grades found" });
    }
    res.json(results);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
