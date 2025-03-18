import express from "express";
import axios from "axios";
import cron from 'node-cron';
import { auth } from "../middleware/auth.middleware.js";
import Attendance from "../models/attendance.model.js";
import Teacher from "../models/teacher.model.js";
import * as attendanceController from "../controllers/attendance.controller.js";

const router = express.Router();

// Schedule the job for every day at 9:45 AM IST
cron.schedule('45 9 * * *', async () => {
    try {
        await attendanceController.performAutoPunchOut();
    } catch (error) {
        console.error('Auto punch-out error:', error);
    }
}, {
    timezone: "Asia/Kolkata"  // Ensures IST scheduling
});

// Function to get address from coordinates - SIMPLIFIED VERSION
async function getAddressFromCoordinates(latitude, longitude) {
  // Return coordinates as formatted string to avoid API errors
  return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}


// Automatic punch-out check every minute
setInterval(async () => {
  try {
    const now = new Date();
    // Check if current time is exactly 9:45 AM IST
    if (now.getHours() === 9 && now.getMinutes() === 45) {
      await attendanceController.performAutoPunchOut();
    }
  } catch (error) {
    console.error("Auto punch-out error:", error);
  }
}, 60000); // Check every minute

// Punch In
router.post("/punch-in", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const teacherId = req.user._id;

    // Allow teachers, admins, and superadmins
    if (!["teacher", "admin", "superadmin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "Only teachers, admins, and superadmins can punch in",
        });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Get address from coordinates
    const address = await getAddressFromCoordinates(latitude, longitude);

    // Check if attendance record exists for today
    let attendance = await Attendance.findOne({
      teacherId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (attendance) {
      return res.status(400).json({ message: "Already punched in for today" });
    }

    // Create new attendance record
    attendance = new Attendance({
      teacherId,
      date: today,
      status: "inprogress",
      punchIn: {
        time: now,
        location: {
          latitude,
          longitude,
          address,
        },
      },
    });

    await attendance.save();

    // Get the formatted response
    const response = attendance.toJSON();

    res.status(201).json({
      message: "Punch in successful",
      attendance: response,
    });
  } catch (error) {
    console.error("Punch in error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Punch Out
router.post("/punch-out", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const teacherId = req.user._id;

    // Allow teachers, admins, and superadmins
    if (!["teacher", "admin", "superadmin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "Only teachers, admins, and superadmins can punch out",
        });
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record with punch-in
    const attendance = await Attendance.findOne({
      teacherId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      "punchIn.time": { $exists: true },
    });

    if (!attendance) {
      return res
        .status(400)
        .json({ message: "You must punch in first before punching out" });
    }

    if (attendance.punchOut && attendance.punchOut.time) {
      return res
        .status(400)
        .json({ message: "You have already punched out for today" });
    }

    // Get address from coordinates
    const address = await getAddressFromCoordinates(latitude, longitude);

    // Update with punch out details
    attendance.punchOut = {
      time: new Date(),
      location: {
        latitude,
        longitude,
        address,
      },
    };

    // Set status to completed
    // attendance.status = 'completed';

    await attendance.save();

    res.json({
      message: "Punch out successful",
      attendance: attendance.toJSON(),
    });
  } catch (error) {
    console.error("Punch out error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get attendance history
router.get("/history", auth, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { startDate, endDate } = req.query;

    let query = { teacherId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendanceRecords = await Attendance.find(query).sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get teacher attendance summary
router.get("/teacher-summary", auth, async (req, res) => {
  await attendanceController.getTeacherAttendanceSummary(req, res);
});

// Get monthly attendance for a specific teacher
router.get("/teacher/:teacherId/monthly/:year/:month", auth, async (req, res) => {
  await attendanceController.getTeacherMonthlyAttendance(req, res);
});

// Get daily attendance for a specific teacher
router.get("/teacher/:teacherId/daily/:date", auth, async (req, res) => {
  await attendanceController.getTeacherDailyAttendance(req, res);
});

// Get all teachers attendance records
router.get("/all-teachers", auth, async (req, res) => {
  await attendanceController.getAllTeachersAttendance(req, res);
});

// Get all attendance records with optional filters
router.get("/all", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query filters
    const query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Get attendance records with pagination
    const attendanceRecords = await Attendance.find(query)
      .populate("teacherId", "name email phone") // Include teacher details
      .sort({ date: -1 }) // Sort by date descending
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      message: "Attendance records retrieved successfully",
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      records: attendanceRecords,
    });
  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-attendance", auth, async (req, res) => {
  try {
    const teacherId = req.user._id;
    const attendanceRecords = await Attendance.find({ teacherId });
    res.json(attendanceRecords); // Ensure this includes punchIn, punchOut, workingHours, and status
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching attendance records",
        error: error.message,
      });
  }
});

export default router;
