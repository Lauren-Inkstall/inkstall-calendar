import Attendance from "../models/attendance.model.js";
import axios from "axios";
import Teacher from "../models/teacher.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";

// Format date to string in expected format
function formatDateToString(date) {
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
}

// Function to perform automatic punch-out at 3:00 PM IST
async function performAutoPunchOut() {
    try {
      // Get today's date at midnight for more accurate querying
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      // Find attendance records where punch-in exists but punch-out is missing
      const unpunchedRecords = await Attendance.find({
        date: {
          $gte: today,
          $lt: tomorrow
        },
        "punchIn.time": { $exists: true },
        "punchOut.time": { $exists: false },
      });
  
      console.log(`Found ${unpunchedRecords.length} records without punch-out`);
  
      for (const record of unpunchedRecords) {
        const punchOutTime = new Date();
        punchOutTime.setHours(22, 30, 0, 0); // Set to 9:45 AM
  
        // Ensure punch-out data is saved correctly
        record.punchOut = {
          time: punchOutTime,
          location: record.punchIn.location, // Reuse punch-in location
        };
  
        // First set status to ensure it's not overwritten
        record.status = "auto-punched-out";
  
        // Explicitly mark fields as modified (in case Mongoose doesn't detect it)
        record.markModified("punchOut");
        record.markModified("status");
  
        // Use save options to bypass schema validation if needed
        await record.save({ validateBeforeSave: false });
  
        console.log(
          `Auto punch-out completed for teacher: ${record.teacherId} & Updated Status: ${record.status}`
        );
      }
  
      return unpunchedRecords;
    } catch (error) {
      console.error("Auto punch-out error:", error);
      throw error;
    }
  }

// Get summary of teacher attendance statistics
async function getTeacherAttendanceSummary(req, res) {
  try {
    console.log("Starting getTeacherAttendanceSummary function...");
    
    // Get all teachers - don't filter by role since the field doesn't exist in model
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers in the database`);
    
    if (teachers.length === 0) {
      console.log("No teachers found. Returning empty array.");
      return res.status(200).json([]);
    }
    
    // Get current date and first day of current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    console.log(`Date range: ${firstDayOfMonth.toISOString()} to ${lastDayOfMonth.toISOString()}`);
    
    // Create date strings for all days in month in the exact format used in the attendance records
    const allDaysInMonth = [];
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
      allDaysInMonth.push(dateStr);
    }
    
    console.log(`Date strings for month: first date ${allDaysInMonth[0]}, last date ${allDaysInMonth[allDaysInMonth.length-1]}`);
    
    // Debug: Check for any attendance records in the database
    const totalAttendanceCount = await Attendance.countDocuments();
    console.log(`Total attendance records in database: ${totalAttendanceCount}`);
    
    // If there are no attendance records at all, suggest creating test data
    if (totalAttendanceCount === 0) {
      console.log("WARNING: No attendance records found in the database. Please create test data.");
    }
    
    // Get a sample attendance record to verify format
    const sampleRecord = await Attendance.findOne();
    if (sampleRecord) {
      console.log("Sample attendance record format:", {
        teacherId: sampleRecord.teacherId,
        date: sampleRecord.date,
        status: sampleRecord.status,
        type: typeof sampleRecord.date
      });
    }
    
    // Initialize results array
    const results = [];
    
    // Process each teacher
    for (const teacher of teachers) {
      console.log(`Processing teacher: ${teacher.teacherName} (${teacher._id})`);
      
      // Get ALL attendance records for this teacher (without date filter first)
      const allTeacherRecords = await Attendance.find({ teacherId: teacher._id });
      console.log(`Teacher ${teacher.teacherName} has ${allTeacherRecords.length} total attendance records (any date)`);
      
      // Now get month-specific records
      let attendanceRecords = await Attendance.find({
        teacherId: teacher._id,
        date: { $in: allDaysInMonth }
      });
      
      console.log(`Teacher ${teacher.teacherName} has ${attendanceRecords.length} attendance records for current month`);
      
      // If no records found with _id, try with teacherId as fallback
      if (attendanceRecords.length === 0 && teacher.teacherId) {
        attendanceRecords = await Attendance.find({
          teacherId: teacher.teacherId,
          date: { $in: allDaysInMonth }
        });
        console.log(`Using teacherId instead: found ${attendanceRecords.length} records`);
      }
      
      // If still no records, try with string version of _id as last resort
      if (attendanceRecords.length === 0) {
        const teacherIdStr = teacher._id.toString();
        attendanceRecords = await Attendance.find({
          teacherId: teacherIdStr,
          date: { $in: allDaysInMonth }
        });
        console.log(`Using string version of _id: found ${attendanceRecords.length} records`);
      }
      
      // Calculate statistics
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let totalWorkingHours = 0;
      
      attendanceRecords.forEach(record => {
        if (record.status === 'present' || record.status === 'auto-punched-out') {
          presentDays++;
          // Ensure workingHours is a number
          const hours = typeof record.workingHours === 'number' ? record.workingHours : 0;
          totalWorkingHours += hours;
        } else if (record.status === 'absent') {
          absentDays++;
        } else if (record.status === 'leave') {
          leaveDays++;
        }
      });
      
      // Calculate average working hours
      const averageHours = presentDays > 0 ? (totalWorkingHours / presentDays).toFixed(1) : "0.0";
      
      // Add to results
      const teacherSummary = {
        teacherId: teacher._id,
        teacherName: teacher.teacherName,
        presentDays,
        absentDays,
        leaveDays,
        averageHours
      };
      
      console.log(`Teacher summary: ${JSON.stringify(teacherSummary)}`);
      results.push(teacherSummary);
    }
    
    console.log(`Returning ${results.length} teacher attendance summaries`);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error getting teacher attendance summary:", error);
    res.status(500).json({ message: "Error getting teacher attendance summary", error: error.message });
  }
}

// Get monthly attendance for a specific teacher
async function getTeacherMonthlyAttendance(req, res) {
  try {
    console.log("======== FETCHING ACTUAL TEACHER ATTENDANCE ========");
    const { teacherId, year, month } = req.params;
    console.log(`Request params: teacherId=${teacherId}, year=${year}, month=${month}`);
    
    // Validate inputs
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    // Create a basic calendar array with default values (always return an array)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dateString = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      calendar.push({
        day,
        date: dateString,
        status: isWeekend ? 'weekend' : 'absent',
        workingHours: 0,
        month: monthNum,
        year: yearNum
      });
    }

    console.log("Fetching all attendance records...");
    
    try {
      // Get all teacher's attendance records directly from the database
      const attendanceRecords = await Attendance.find({ teacherId }).lean();
      
      console.log(`Found ${attendanceRecords.length} total records for teacher ${teacherId}`);
      
      if (attendanceRecords.length === 0) {
        console.log("No attendance records found for this teacher");
        // Return calendar with default values
        return res.json(calendar);
      }
      
      // Filter for records in the specified month and year
      const monthlyRecords = attendanceRecords.filter(record => {
        try {
          if (!record.date) return false;
          
          const dateStr = record.date.toString();
          const parts = dateStr.split(',');
          if (parts.length < 1) return false;
          
          const dateParts = parts[0].split('/');
          if (dateParts.length < 3) return false;
          
          const recordMonth = parseInt(dateParts[0]);
          const recordDay = parseInt(dateParts[1]);
          const recordYear = parseInt(dateParts[2]);
          
          return recordMonth === monthNum && recordYear === yearNum;
        } catch (e) {
          console.error("Error parsing date:", e);
          return false;
        }
      });
      
      console.log(`Found ${monthlyRecords.length} records for month ${monthNum}/${yearNum}`);
      
      if (monthlyRecords.length === 0) {
        console.log("No records found for this month");
        // Return calendar with default values
        return res.json(calendar);
      }
      
      // Process and enhance each record
      monthlyRecords.forEach(record => {
        try {
          // Extract day from date
          const dateParts = record.date.toString().split(',')[0].split('/');
          if (dateParts.length < 3) return;
          
          const day = parseInt(dateParts[1]);
          if (day < 1 || day > calendar.length) return;
          
          // Get the calendar entry for this day
          const dayData = calendar[day - 1];
          
          // Skip weekends
          if (dayData.status === 'weekend') return;
          
          console.log(`Processing record for day ${day}`);
          
          // Update with actual attendance data
          dayData.status = record.status || 'present';
          
          // Process working hours
          if (record.workingHours !== undefined && record.workingHours !== null) {
            if (typeof record.workingHours === 'number') {
              dayData.workingHours = record.workingHours;
            } else {
              const parsed = parseFloat(record.workingHours);
              if (!isNaN(parsed)) {
                dayData.workingHours = parsed;
              }
            }
          }
          
          // Process punch-in data
          if (record.punchIn && record.punchIn.time) {
            const timeParts = record.punchIn.time.toString().split(',');
            dayData.punchIn = timeParts.length > 1 ? timeParts[1].trim() : record.punchIn.time;
            
            if (record.punchIn.location) {
              dayData.punchInLocation = record.punchIn.location.address || '';
              dayData.location = record.punchIn.location.address || '';
              
              dayData.punchInDetails = {
                address: record.punchIn.location.address || ''
              };
              
              if (record.punchIn.location.latitude && record.punchIn.location.longitude) {
                dayData.punchInDetails.latitude = record.punchIn.location.latitude;
                dayData.punchInDetails.longitude = record.punchIn.location.longitude;
              }
            }
          }
          
          // Process punch-out data
          if (record.punchOut && record.punchOut.time) {
            const timeParts = record.punchOut.time.toString().split(',');
            dayData.punchOut = timeParts.length > 1 ? timeParts[1].trim() : record.punchOut.time;
            
            if (record.punchOut.location) {
              dayData.punchOutLocation = record.punchOut.location.address || '';
              if (!dayData.location) {
                dayData.location = record.punchOut.location.address || '';
              }
              
              dayData.punchOutDetails = {
                address: record.punchOut.location.address || ''
              };
              
              if (record.punchOut.location.latitude && record.punchOut.location.longitude) {
                dayData.punchOutDetails.latitude = record.punchOut.location.latitude;
                dayData.punchOutDetails.longitude = record.punchOut.location.longitude;
              }
            }
          }
        } catch (e) {
          console.error("Error processing record:", e);
        }
      });
      
      // Log a couple samples of what we're returning
      if (calendar.length > 0) {
        console.log("Sample day data (first day):", JSON.stringify(calendar[0], null, 2));
        if (calendar.length > 15) {
          console.log("Sample day data (middle of month):", JSON.stringify(calendar[15], null, 2));
        }
      }
      
      return res.json(calendar);
      
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      return res.status(500).json({ 
        message: "Error fetching attendance records", 
        error: error.message 
      });
    }
  } catch (error) {
    console.error("Error in getTeacherMonthlyAttendance:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
}

// Get teacher attendance for a specific date
async function getTeacherDailyAttendance(req, res) {
  try {
    console.log("======== FETCHING TEACHER DAILY ATTENDANCE ========");
    const { teacherId, date } = req.params;
    console.log(`Request params: teacherId=${teacherId}, date=${date}`);
    
    // Validate date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    // Parse the date parts
    const [year, month, day] = date.split('-').map(part => parseInt(part));
    const dateObj = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    
    // Check if the date is a weekend
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    
    // Create a default response
    const attendanceData = {
      date,
      day,
      month,
      year,
      status: isWeekend ? 'weekend' : 'absent',
      workingHours: 0,
      punchIn: null,
      punchOut: null,
      punchInLocation: null,
      punchOutLocation: null,
      punchInDetails: {
        address: null
      },
      punchOutDetails: {
        address: null
      }
    };
    
    try {
      console.log("Fetching attendance record...");
      
      // Format date string for database query
      // MongoDB stores it in format like "3/10/2025, 9:30:00 AM"
      // We need to search for any record that starts with "M/D/YYYY"
      const dbDatePrefix = `${month}/${day}/${year}`;
      
      console.log(`Looking for records with date prefix: ${dbDatePrefix}`);
      
      // Find the attendance record
      const attendanceRecords = await Attendance.find({ teacherId }).lean();
      
      // Filter for the specific date
      const dayRecord = attendanceRecords.find(record => {
        try {
          if (!record.date) return false;
          return record.date.toString().startsWith(dbDatePrefix);
        } catch (e) {
          return false;
        }
      });
      
      if (!dayRecord) {
        console.log("No attendance record found for this date");
        return res.json(attendanceData);
      }
      
      console.log("Found attendance record:", JSON.stringify(dayRecord, null, 2));
      
      // Update with actual data
      attendanceData.status = dayRecord.status || attendanceData.status;
      
      if (dayRecord.workingHours !== undefined && dayRecord.workingHours !== null) {
        if (typeof dayRecord.workingHours === 'number') {
          attendanceData.workingHours = dayRecord.workingHours;
        } else {
          const parsed = parseFloat(dayRecord.workingHours);
          if (!isNaN(parsed)) {
            attendanceData.workingHours = parsed;
          }
        }
      }
      
      // Process punch-in data
      if (dayRecord.punchIn && dayRecord.punchIn.time) {
        const timeParts = dayRecord.punchIn.time.toString().split(',');
        attendanceData.punchIn = timeParts.length > 1 ? timeParts[1].trim() : dayRecord.punchIn.time;
        
        if (dayRecord.punchIn.location) {
          attendanceData.punchInLocation = dayRecord.punchIn.location.address || null;
          
          attendanceData.punchInDetails = {
            address: dayRecord.punchIn.location.address || null
          };
          
          if (dayRecord.punchIn.location.latitude && dayRecord.punchIn.location.longitude) {
            attendanceData.punchInDetails.latitude = dayRecord.punchIn.location.latitude;
            attendanceData.punchInDetails.longitude = dayRecord.punchIn.location.longitude;
          }
        }
      }
      
      // Process punch-out data
      if (dayRecord.punchOut && dayRecord.punchOut.time) {
        const timeParts = dayRecord.punchOut.time.toString().split(',');
        attendanceData.punchOut = timeParts.length > 1 ? timeParts[1].trim() : dayRecord.punchOut.time;
        
        if (dayRecord.punchOut.location) {
          attendanceData.punchOutLocation = dayRecord.punchOut.location.address || null;
          
          attendanceData.punchOutDetails = {
            address: dayRecord.punchOut.location.address || null
          };
          
          if (dayRecord.punchOut.location.latitude && dayRecord.punchOut.location.longitude) {
            attendanceData.punchOutDetails.latitude = dayRecord.punchOut.location.latitude;
            attendanceData.punchOutDetails.longitude = dayRecord.punchOut.location.longitude;
          }
        }
      }
      
    } catch (error) {
      console.error("Error fetching daily attendance:", error);
      // Return default data on error
      return res.json(attendanceData);
    }
    
    console.log("Returning attendance data:", JSON.stringify(attendanceData, null, 2));
    return res.json(attendanceData);
    
  } catch (error) {
    console.error("Error in getTeacherDailyAttendance:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
}

// Get all teachers attendance records
async function getAllTeachersAttendance(req, res) {
  try {
    console.log("======== FETCHING ALL TEACHERS ATTENDANCE ========");
    const { date } = req.query;
    console.log(`Request query params: date=${date || 'all'}`);
    
    // Get all teachers with their basic info
    const teachers = await User.find({ role: "teacher" }).select('_id name email phone').lean();
    console.log(`Found ${teachers.length} teachers`);
    
    if (teachers.length === 0) {
      return res.json([]);
    }
    
    // Create response array
    const allAttendance = [];
    
    // For each teacher, get their attendance records
    for (const teacher of teachers) {
      try {
        console.log(`Processing teacher: ${teacher.name} (${teacher._id})`);
        
        // Set up query for attendance records
        const query = { teacherId: teacher._id };
        
        // If date is specified, filter by that date
        if (date) {
          // Parse date components
          const [year, month, day] = date.split('-').map(part => parseInt(part));
          
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            console.error("Invalid date format:", date);
            continue;
          }
          
          // Format for MongoDB query (M/D/YYYY)
          const dbDatePrefix = `${month}/${day}/${year}`;
          console.log(`Looking for records on date: ${dbDatePrefix}`);
          
          // Get all records for this teacher
          const teacherRecords = await Attendance.find(query).lean();
          
          // Filter records by date
          const dateRecords = teacherRecords.filter(record => {
            try {
              if (!record.date) return false;
              return record.date.toString().startsWith(dbDatePrefix);
            } catch (e) {
              return false;
            }
          });
          
          console.log(`Found ${dateRecords.length} records for teacher on ${date}`);
          
          // If records found, process them
          if (dateRecords.length > 0) {
            for (const record of dateRecords) {
              const attendanceRecord = formatAttendanceRecord(record, teacher, date);
              allAttendance.push(attendanceRecord);
            }
          } else {
            // No record for this date, create default record
            const defaultRecord = {
              teacherId: teacher._id,
              teacherName: teacher.name,
              teacherEmail: teacher.email,
              teacherPhone: teacher.phone,
              date: date,
              day: day,
              month: month,
              year: year,
              status: new Date(year, month-1, day).getDay() === 0 || new Date(year, month-1, day).getDay() === 6 ? 'weekend' : 'absent',
              workingHours: 0,
              punchIn: null,
              punchOut: null,
              punchInLocation: null,
              punchOutLocation: null,
              punchInDetails: { address: null },
              punchOutDetails: { address: null }
            };
            allAttendance.push(defaultRecord);
          }
        } else {
          // No date filter, get all records for this teacher
          const teacherRecords = await Attendance.find(query).lean();
          console.log(`Found ${teacherRecords.length} total records for teacher`);
          
          // Process all records
          for (const record of teacherRecords) {
            try {
              // Extract date parts from record
              const dateParts = record.date.toString().split(',')[0].split('/');
              if (dateParts.length < 3) continue;
              
              const month = parseInt(dateParts[0]);
              const day = parseInt(dateParts[1]);
              const year = parseInt(dateParts[2]);
              
              const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              
              // Format record
              const attendanceRecord = formatAttendanceRecord(record, teacher, dateString);
              allAttendance.push(attendanceRecord);
            } catch (e) {
              console.error("Error processing record:", e);
            }
          }
        }
      } catch (e) {
        console.error(`Error processing teacher ${teacher._id}:`, e);
      }
    }
    
    console.log(`Returning ${allAttendance.length} attendance records`);
    return res.json(allAttendance);
    
  } catch (error) {
    console.error("Error in getAllTeachersAttendance:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
}

// Helper function to format attendance record
function formatAttendanceRecord(record, teacher, dateString) {
  // Extract date parts if not already provided
  let day, month, year;
  
  if (dateString && dateString.includes('-')) {
    [year, month, day] = dateString.split('-').map(part => parseInt(part));
  } else {
    const dateParts = record.date.toString().split(',')[0].split('/');
    month = parseInt(dateParts[0]);
    day = parseInt(dateParts[1]);
    year = parseInt(dateParts[2]);
    dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Extract punch-in time and location
  let punchIn = null;
  let punchInLocation = null;
  let punchInDetails = { address: null };
  
  if (record.punchIn && record.punchIn.time) {
    const timeParts = record.punchIn.time.toString().split(',');
    punchIn = timeParts.length > 1 ? timeParts[1].trim() : record.punchIn.time;
    
    if (record.punchIn.location) {
      punchInLocation = record.punchIn.location.address || null;
      punchInDetails = record.punchIn.location || { address: null };
    }
  }
  
  // Extract punch-out time and location
  let punchOut = null;
  let punchOutLocation = null;
  let punchOutDetails = { address: null };
  
  if (record.punchOut && record.punchOut.time) {
    const timeParts = record.punchOut.time.toString().split(',');
    punchOut = timeParts.length > 1 ? timeParts[1].trim() : record.punchOut.time;
    
    if (record.punchOut.location) {
      punchOutLocation = record.punchOut.location.address || null;
      punchOutDetails = record.punchOut.location || { address: null };
    }
  }
  
  // Extract working hours
  let workingHours = 0;
  if (record.workingHours !== undefined && record.workingHours !== null) {
    if (typeof record.workingHours === 'number') {
      workingHours = record.workingHours;
    } else {
      const parsed = parseFloat(record.workingHours);
      if (!isNaN(parsed)) {
        workingHours = parsed;
      }
    }
  }
  
  // Check if weekend
  const dateObj = new Date(year, month - 1, day);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  
  // Return formatted record
  return {
    teacherId: teacher._id,
    teacherName: teacher.name,
    teacherEmail: teacher.email,
    teacherPhone: teacher.phone,
    date: dateString,
    day: day,
    month: month,
    year: year,
    status: record.status || (isWeekend ? 'weekend' : 'absent'),
    workingHours: workingHours,
    punchIn: punchIn,
    punchOut: punchOut,
    punchInLocation: punchInLocation,
    punchOutLocation: punchOutLocation,
    punchInDetails: punchInDetails,
    punchOutDetails: punchOutDetails
  };
}

// Export functions
export { 
    performAutoPunchOut, 
    getTeacherAttendanceSummary,
    getTeacherMonthlyAttendance,
    getTeacherDailyAttendance,
    getAllTeachersAttendance
};
