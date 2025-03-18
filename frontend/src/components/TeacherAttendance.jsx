import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import api from '../api';

const TeacherAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  
  // Use useEffect to fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        // console.log("Fetching all teachers attendance data");
        const response = await api.get("/attendance/all-teachers");
        // console.log("Attendance data:", response.data);
        
        // Check if response.data is array directly or is in records property
        const attendanceRecords = Array.isArray(response.data) 
          ? response.data 
          : (response.data.records || []);
        
        if (Array.isArray(attendanceRecords)) {
          setAttendanceData(attendanceRecords);
          
          // Extract unique teachers from attendance data
          const teachersMap = {};
          
          attendanceRecords.forEach(record => {
            if (record.teacherId && !teachersMap[record.teacherId]) {
              teachersMap[record.teacherId] = {
                _id: record.teacherId,
                name: record.teacherName || 'Unknown Teacher',
                attendance: []
              };
            }
            
            if (record.teacherId) {
              if (!teachersMap[record.teacherId].attendance) {
                teachersMap[record.teacherId].attendance = [];
              }
              teachersMap[record.teacherId].attendance.push(record);
            }
          });
          
          const teachersList = Object.values(teachersMap);
          // console.log("Extracted teachers with attendance:", teachersList);
          
          // Calculate attendance stats for each teacher
          teachersList.forEach(teacher => {
            const teacherAttendance = teacher.attendance || [];
            const presentDays = teacherAttendance.filter(a => 
              (a.status && a.status.toLowerCase() === 'present')).length;
            const absentDays = teacherAttendance.filter(a => 
              (a.status && a.status.toLowerCase() === 'absent')).length;
            const leaveDays = teacherAttendance.filter(a => 
              (a.status && (a.status.toLowerCase() === 'leave' || a.status.toLowerCase() === 'on leave'))).length;
            
            let totalHours = 0;
            let recordsWithHours = 0;
            
            teacherAttendance.forEach(record => {
              if (record.workingHours) {
                const hours = parseFloat(record.workingHours);
                if (!isNaN(hours)) {
                  totalHours += hours;
                  recordsWithHours++;
                }
              }
            });
            
            const averageHours = recordsWithHours > 0 ? (totalHours / recordsWithHours).toFixed(1) : 0;
            
            teacher.presentDays = presentDays;
            teacher.absentDays = absentDays;
            teacher.leaveDays = leaveDays;
            teacher.averageHours = averageHours;
          });
          
          setTeachers(teachersList);
        } else {
          setError("Invalid attendance data format received");
          console.error("Invalid data format received:", response.data);
        }
      } catch (error) {
        setError("Error fetching attendance data: " + error.message);
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, []);
  
  // Import the card component only when needed on the client side
  const TeacherAttendanceCard = React.lazy(() => import('./ui/TeacherAttendanceCard'));
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Error: {error}
        </Typography>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading attendance data...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <h2 className="text-2xl font-bold text-secondary">
              Teachers Attendance
            </h2>
      
      {teachers.length === 0 ? (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">No attendance data found</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {teachers.map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher._id}>
              <React.Suspense fallback={<div>Loading card...</div>}>
                <TeacherAttendanceCard
                  teacherId={teacher._id}
                  teacherName={teacher.name}
                  presentDays={teacher.presentDays}
                  absentDays={teacher.absentDays}
                  leaveDays={teacher.leaveDays}
                  averageHours={teacher.averageHours}
                />
              </React.Suspense>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default TeacherAttendance;