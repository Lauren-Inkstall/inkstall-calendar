import TeacherPoints from '../models/teacherpoints.model.js';
import { POINTS, calculateTestPoints } from '../constants/points.js';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Get or create teacher points record for current month
export const getOrCreateTeacherPoints = async (teacherId, teacherName) => {
  const currentMonth = getCurrentMonth();
  
  let pointsRecord = await TeacherPoints.findOne({
    teacherId,
    month: currentMonth
  });
  
  if (!pointsRecord) {
    pointsRecord = new TeacherPoints({
      teacherId,
      teacherName,
      month: currentMonth
    });
    await pointsRecord.save();
  }
  
  return pointsRecord;
};

// Add points for daily update
export const addDailyUpdatePoints = async (teacherId, teacherName) => {
  const pointsRecord = await getOrCreateTeacherPoints(teacherId, teacherName);
  pointsRecord.dailyUpdatePoints += POINTS.DAILY_UPDATE;
  await pointsRecord.save();
  return {
    pointsAwarded: POINTS.DAILY_UPDATE,
    totalPoints: pointsRecord.totalPoints
  };
};

// Add points for K-Sheet submission
export const addKSheetPoints = async (teacherId, teacherName) => {
  const pointsRecord = await getOrCreateTeacherPoints(teacherId, teacherName);
  pointsRecord.kSheetPoints += POINTS.K_SHEET;
  await pointsRecord.save();
  return {
    pointsAwarded: POINTS.K_SHEET,
    totalPoints: pointsRecord.totalPoints
  };
};

// Add points for test submission
export const addTestPoints = async (teacherId, teacherName, testMarks) => {
  const pointsRecord = await getOrCreateTeacherPoints(teacherId, teacherName);
  const pointsAwarded = calculateTestPoints(testMarks);
  pointsRecord.testPoints += pointsAwarded;
  await pointsRecord.save();
  return {
    pointsAwarded,
    totalPoints: pointsRecord.totalPoints
  };
};

// Get teacher points for current month
export const getTeacherPointsForCurrentMonth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user logged in' });
    }
    
    const teacherId = req.user._id;
    const teacherName = req.user.name;
    
    const pointsRecord = await getOrCreateTeacherPoints(teacherId, teacherName);
    
    res.status(200).json(pointsRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teacher points (for admin and teachers)
export const getAllTeacherPoints = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user logged in' });
    }
    
    // Fixed the syntax error in role check
    if (!['admin', 'superadmin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Admin or teacher access required' });
    }
    
    const currentMonth = getCurrentMonth();
    const pointsRecords = await TeacherPoints.find({ month: currentMonth });
    
    res.status(200).json(pointsRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Test endpoint to manually award points (for testing with Postman)
export const awardPointsManually = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user logged in' });
    }
    
    const { pointType, testMarks } = req.body;
    const teacherId = req.user._id;
    const teacherName = req.user.name;
    
    let result;
    
    switch (pointType) {
      case 'dailyUpdate':
        result = await addDailyUpdatePoints(teacherId, teacherName);
        break;
      case 'kSheet':
        result = await addKSheetPoints(teacherId, teacherName);
        break;
      case 'test':
        if (!testMarks) {
          return res.status(400).json({ message: 'Test marks are required for test points' });
        }
        result = await addTestPoints(teacherId, teacherName, testMarks);
        break;
      default:
        return res.status(400).json({ message: 'Invalid point type. Use dailyUpdate, kSheet, or test' });
    }
    
    res.status(200).json({
      message: `${pointType} points awarded successfully`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};