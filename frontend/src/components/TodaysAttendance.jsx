import React, { useState, useEffect, useMemo } from "react";
import MainFrame from "./ui/MainFrame";
import { Box, Card, Typography, CircularProgress, Alert } from "@mui/material";
import InkstallButton from "./ui/InkstallButton";
import api from "../api";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "react-toastify";
// Import the hook that fetches ALL teacher points (for top performers)
import useTeacherPoints from "../hooks/useAllTeacherPoints";
import { useNotification } from "../context/NotificationContext";
import Marquee from "react-fast-marquee";
import { useMediaQuery, useTheme } from "@mui/material";

// Extend dayjs to support custom date formats
dayjs.extend(customParseFormat);

// Helper function to extract the time portion from a datetime string (e.g., "3/11/2025, 9:11:25 AM")
const extractTimeFromDatetime = (datetimeString) => {
  if (!datetimeString || typeof datetimeString !== "string") return "--";
  const parts = datetimeString.split(",");
  return parts.length > 1 ? parts[1].trim() : datetimeString;
};

const TodaysAttendance = () => {
  // Local state for attendance status and punch times
  const [checkedIn, setCheckedIn] = useState(false);
  const [lastPunchIn, setLastPunchIn] = useState("--");
  const [lastPunchOut, setLastPunchOut] = useState("--");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);

  // Use the custom hook to fetch all teachers' points (used in Top Performers table)
  const {
    points: teacherPoints,
    loading: teacherLoading,
    error: teacherError,
  } = useTeacherPoints();

  // Get notifications from the context
  const { notifications } = useNotification();
  
  // Force update state to trigger re-renders for time-based checks
  const [forceUpdate, setForceUpdate] = useState(0);

  // Filter active announcements (within start and end datetime)
  const activeAnnouncements = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    const now = new Date();
    return notifications
      .filter(notification => 
        // Only include broadcasts that have started and haven't expired
        notification.startAt && 
        new Date(notification.startAt) <= now && // Start time has passed
        (
          !notification.expiresAt || // No expiration
          new Date(notification.expiresAt) > now // Not expired yet
        )
      )
      // Sort by creation date (newest first)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications, forceUpdate]);

  // Set up an interval to check for expired announcements
  useEffect(() => {
    // Skip if no announcements
    if (!notifications || notifications.length === 0) return;
    
    // Check for expired announcements every minute
    const intervalId = setInterval(() => {
      // Force a re-render to update the active announcements list
      setForceUpdate(prev => prev + 1);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [notifications]);

  // Function to fetch today's attendance history from the API
  const fetchAttendanceHistory = async () => {
    try {
      // Reset attendance display values
      setLastPunchIn("--");
      setLastPunchOut("--");
      setCheckedIn(false);

      // Format today's date as M/D/YYYY
      const today = new Date();
      const month = today.getMonth() + 1; // JavaScript months are zero-indexed
      const day = today.getDate();
      const year = today.getFullYear();
      const formattedDate = `${month}/${day}/${year}`;

      const response = await api.get(
        `/attendance/history?date=${formattedDate}`
      );

      if (response.data && response.data.length > 0) {
        // Filter records to match today's date exactly
        const todayRecords = response.data.filter((record) => {
          if (typeof record.date === "string") {
            const datePart = record.date.split(",")[0]?.trim();
            return datePart === formattedDate;
          }
          return false;
        });

        if (todayRecords.length > 0) {
          const attendance = todayRecords[0];

          // If punch-in time exists, extract and set it; mark checkedIn if punch-out is missing
          if (attendance.punchIn?.time) {
            const punchInTime = extractTimeFromDatetime(
              attendance.punchIn.time
            );
            setLastPunchIn(punchInTime);
            setCheckedIn(!attendance.punchOut?.time);
          }
          // If punch-out time exists, extract and set it; mark checkedIn as false
          if (attendance.punchOut?.time) {
            const punchOutTime = extractTimeFromDatetime(
              attendance.punchOut.time
            );
            setLastPunchOut(punchOutTime);
            setCheckedIn(false);
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      toast.error("Failed to fetch attendance data");
    }
  };

  // Fetch attendance data when the component mounts
  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  // Handle punch actions ("In" or "Out")
  const handlePunchAction = async (type) => {
    setLoading(true);
    try {
      // Prevent duplicate actions
      if (type === "Out" && lastPunchOut !== "--") {
        toast.warning("You have already punched out for today");
        setLoading(false);
        return;
      }
      if (type === "In" && checkedIn) {
        toast.warning("You are already punched in for today");
        setLoading(false);
        return;
      }

      // Get current location using the geolocation API
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(
                  new Error("Please allow location access to mark attendance")
                );
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error("Location information is unavailable"));
                break;
              case error.TIMEOUT:
                reject(new Error("Location request timed out"));
                break;
              default:
                reject(error);
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const { latitude, longitude } = position.coords;
      const now = new Date();
      const formattedTime = now.toISOString();

      const payload = {
        latitude: Number(latitude.toFixed(7)),
        longitude: Number(longitude.toFixed(7)),
        time: formattedTime,
      };

      const endpoint =
        type === "In" ? "/attendance/punch-in" : "/attendance/punch-out";
      await api.post(endpoint, payload);


      // Format time for display (e.g., "9:11 AM")
      const displayTime = now.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (type === "In") {
        setCheckedIn(true);
        setLastPunchIn(displayTime);
      } else {
        setCheckedIn(false);
        setLastPunchOut(displayTime);
      }

      // Refresh attendance data after punching
      await fetchAttendanceHistory();
      toast.success(`Successfully punched ${type.toLowerCase()}!`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to punch ${type.toLowerCase()}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const sortedTeachers = useMemo(() => {
    if (Array.isArray(teacherPoints) && teacherPoints.length > 0) {
      return teacherPoints
        .filter((teacher) => teacher.totalPoints > 0)
        .sort((a, b) => b.totalPoints - a.totalPoints);
    }
    return [];
  }, [teacherPoints]);

  return (
    <MainFrame>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Today's Attendance Section */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 4, boxShadow: 1 }}>
          <Typography
            sx={{
              color: "#000066",
              fontWeight: 800,
              fontSize: "22px",
              textAlign: "center",
              mb: 2,
            }}
          >
            Today's Attendance
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              justifyContent: "center",
              width: "100%",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
            }}
          >
            {/* Punch In Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
                width: { xs: "100%", md: "50%" },
              }}
            >
              <InkstallButton
                texts="In"
                btnColor="#3366cc"
                visibility={visibility}
                onClick={() => handlePunchAction("In")}
                loading={loading}
                w="200px"
                h="200px"
              />
              <Card
                sx={{
                  width: { xs: "auto", md: "30%" },
                  p: 1,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{ fontSize: "14px", color: "black", fontWeight: 500 }}
                >
                  Last In: {lastPunchIn}
                </Typography>
              </Card>
            </Box>
            {/* Punch Out Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
                width: { xs: "100%", md: "50%" },
              }}
            >
              <InkstallButton
                texts="Out"
                btnColor="#fecc00"
                visibility={visibility}
                onClick={() => handlePunchAction("Out")}
                loading={loading}
                w="200px"
                h="200px"
              />
              <Card
                sx={{
                  width: { xs: "auto", md: "30%" },
                  p: 1,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{ fontSize: "14px", color: "black", fontWeight: 500 }}
                >
                  Last Out: {lastPunchOut}
                </Typography>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Scrolling Announcement Banner */}
        {activeAnnouncements.length > 0 && (
          <Box 
            sx={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: '8px',
              p: 2,
            }}
          >
            <Marquee
              speed={40}
              pauseOnHover={true}
              gradient={false}
              direction="left"
            >
              {activeAnnouncements.map((announcement, index) => (
                <Typography
                  key={index}
                  component="div"
                  sx={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    color: '#D32F2F',
                    fontWeight: 'bold',
                    paddingRight: '50px',
                  }}
                >
                  📢 {announcement.message}
                </Typography>
              ))}
            </Marquee>
          </Box>
        )}

        {/* Top Performers Table Section */}
        <Box className="mb-4 md:mb-8 w-full max-w-4xl mx-auto px-2 sm:px-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
            Top Performers
          </h2>
          {teacherLoading ? (
            <div className="flex justify-center items-center h-24 sm:h-32">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : teacherError ? (
            <div className="flex justify-center items-center h-24 sm:h-32">
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm sm:text-base">
                <p>{teacherError}</p>
              </div>
            </div>
          ) : sortedTeachers.length > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#3366cc] text-white">
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">Rank</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">Teacher</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm hidden sm:table-cell">Activity Points</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm sm:hidden">Points</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeachers.map((teacher, index) => (
                      <tr
                        key={index}
                        className={index === 0 ? "bg-yellow-50" : ""}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-indigo-100">
                          <div className="flex items-center">
                            {index === 0 ? (
                              <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-yellow-400 text-yellow-800 rounded-full text-xs sm:text-sm font-bold">
                                1
                              </span>
                            ) : (
                              <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full text-xs sm:text-sm font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-indigo-100">
                          <div className="flex items-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#3366cc] text-white flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm">
                              {teacher.teacherName ? teacher.teacherName[0] : "?"}
                            </div>
                            <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                              {isMobile ? teacher.teacherName.split(' ')[0] : teacher.teacherName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-indigo-100 text-right font-bold text-xs sm:text-sm hidden sm:table-cell">
                          {teacher.totalPoints.toLocaleString()}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-indigo-100 text-right font-bold text-xs sm:text-sm sm:hidden">
                          {teacher.totalPoints.toLocaleString()}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-indigo-100 text-right">
                          <span className="bg-indigo-100 text-indigo-800 py-0.5 px-1.5 sm:py-1 sm:px-2 rounded-full text-xxs sm:text-xs font-bold whitespace-nowrap">
                            Level {Math.floor(teacher.totalPoints / 2000) + 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-24 sm:h-32">
              <p className="text-gray-500 text-sm sm:text-base">No points data available yet</p>
            </div>
          )}
        </Box>
      </Box>
    </MainFrame>
  );
};

export default TodaysAttendance;