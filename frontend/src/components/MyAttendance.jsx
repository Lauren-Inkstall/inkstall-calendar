import React, { useEffect, useState } from "react";
import { Box, Button, Card } from "@mui/material";
import { AttendanceCard } from "./ui/AttendanceCard";
import MainFrame from "./ui/MainFrame";
import ApplyForLeaveForm from "./ui/ApplyForLeaveForm";
import { Typography, Chip, CircularProgress, Divider, Alert } from "@mui/material";
import Backdrop from "@mui/material/Backdrop";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import api from "../api";

const MyAttendance = () => {
  const [open, setOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);


  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "90%",
      sm: "80%",
      md: "60%",
      lg: "50%",
    },
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    bgcolor: "background.paper",
    boxShadow: 19,
    p: { xs: 2, sm: 3 },
    borderRadius: 1,
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoadingLeaveRequests(true);
      const response = await api.get('/leave-requests/my-requests');
      
      // Calculate date 3 months ago from today
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      // Filter leave requests to only show those from the past 3 months
      const filteredRequests = response.data.filter(request => {
        const requestDate = new Date(request.createdAt || request.startDate);
        return requestDate >= threeMonthsAgo;
      });
      
      // Sort by most recent first
      const sortedRequests = filteredRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB - dateA;
      });
      
      setLeaveRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoadingLeaveRequests(false);
    }
  };

  // Fetch attendance data from the updated API endpoint
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await api.get("/attendance/my-attendance");
  
        // 1. Sort the response data so that latest date appears first
        const sortedData = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
  
        // 2. Format the sorted data
        const formattedData = sortedData.map((attendance) => ({
          ...attendance,
          date: new Date(attendance.date).toLocaleDateString('en-GB'),          dayOfWeek: new Date(attendance.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          checkIn: attendance.punchIn
            ? {
                time: new Date(attendance.punchIn.time).toLocaleTimeString(),
                location:
                  attendance.punchIn.location?.address || "Unknown Location",
              }
            : null,
          checkOut: attendance.punchOut
            ? {
                time: new Date(attendance.punchOut.time).toLocaleTimeString(),
                location:
                  attendance.punchOut.location?.address || "Unknown Location",
              }
            : null,
          workingHours:
            attendance.workingHours > 0 ? `${attendance.workingHours} hrs` : "0",
          status: attendance.status, // Use status directly from backend
        }));
  
        // 3. Update state with sorted & formatted data
        setAttendanceData(formattedData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };
  
    fetchAttendanceData();
    fetchLeaveRequests();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  return (
    <MainFrame>
      <Card className="w-full mx-auto p-6 mb-5">
        <Box>
          <Box className="w-full flex items-start justify-between mb-4">
            <h2 className="text-2xl font-semibold mb-2 text-primary">
              Recent Leave Requests
            </h2>

            <Button
              onClick={handleOpen}
              sx={{ backgroundColor: "#fecc00", color: "#fff", fontSize: "14px" }}
            >
              Apply for a Leave
            </Button>
          </Box>
          
          {loadingLeaveRequests ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : leaveRequests.length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              mb: 3
            }}>
              {leaveRequests.slice(0, 3).map((request, index) => (
                <Box key={request._id || index} sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  border: '1px solid #e0e0e0',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </Typography>
                    <Chip 
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} 
                      size="small"
                      sx={{ 
                        bgcolor: getStatusColor(request.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reason:</strong> {request.reasonForLeave}
                  </Typography>
                  {request.leaveType !== 'pending' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Leave Type:</strong> {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info" sx={{ my: 2 }}>
              No recent leave requests found
            </Alert>
          )}
        </Box>
      </Card>
      <Card className="w-full mx-auto p-6">
        <Box className="w-full flex items-start justify-between">
          <h2 className="text-2xl font-semibold mb-6 text-primary">
            Recent Attendance (Last 30 Days)
          </h2>
        </Box>
        <div className="space-y-4">
          {attendanceData.map((attendance) => (
            <AttendanceCard
              key={attendance._id} // Ensure unique key
              date={attendance.date}
              dayOfWeek={attendance.dayOfWeek}
              status={attendance.status}
              checkIn={attendance.checkIn}
              checkOut={attendance.checkOut}
              workingHours={attendance.workingHours}
            />
          ))}
        </div>
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <ApplyForLeaveForm />
          </Box>
        </Fade>
      </Modal>
    </MainFrame>
  );
};

export default MyAttendance;