import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, IconButton, Tooltip } from "@mui/material";
import { X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import api from '../../api';

const TeacherAttendanceCalendar = ({ teacherId, teacherName, preloadedData, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState({
    presentDays: 0,
    leaveDays: 0,
    absentDays: 0,
    autoPunchOutDays: 0,
    totalWorkingHours: 0
  });
  
  // Determine if we should show as a dialog or inline
  const showAsDialog = !preloadedData;
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  useEffect(() => {
    if (!teacherId) return;
    
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        
        // If we have preloaded data, use it instead of making an API call
        if (preloadedData && preloadedData.length > 0) {
          console.log("Using preloaded attendance data");
          processAttendanceData(preloadedData);
          return;
        }
        
        // Otherwise make the API call
        console.log("Fetching attendance for teacher ID:", teacherId);
        const response = await api.get(`/attendance/teacher/${teacherId}/monthly/${currentYear}/${currentMonth}`);
        console.log("Response data:", response.data);
        
        if (!Array.isArray(response.data)) {
          console.error("Invalid data format received:", response.data);
          setLoading(false);
          return;
        }
        
        processAttendanceData(response.data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to load calendar data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();
  }, [teacherId, currentMonth, currentYear, preloadedData]);
  
  const processAttendanceData = (data) => {
    // Filter data for current month and year if using preloaded data
    const filteredData = preloadedData ? 
      data.filter(item => item.month === currentMonth && item.year === currentYear) : 
      data;
    
    console.log("Filtered attendance data:", filteredData);
    
    // For preloaded data, we need to convert it to the calendar format expected by the component
    if (preloadedData) {
      // Create a days array with each day of the month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const formattedData = [];
      
      // Initialize with default values
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        formattedData.push({
          day,
          date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          status: isWeekend ? 'weekend' : 'absent',
          workingHours: 0,
          punchIn: null,
          punchOut: null,
          punchInLocation: null,
          punchOutLocation: null,
          punchInDetails: { address: null },
          punchOutDetails: { address: null }
        });
      }
      
      // Override with actual attendance data
      filteredData.forEach(item => {
        if (item.day && item.day >= 1 && item.day <= daysInMonth) {
          formattedData[item.day - 1] = {
            day: item.day,
            date: item.date,
            status: item.status || formattedData[item.day - 1].status,
            workingHours: item.workingHours || 0,
            punchIn: item.punchIn || null,
            punchOut: item.punchOut || null,
            punchInLocation: item.punchInLocation || null,
            punchOutLocation: item.punchOutLocation || null,
            punchInDetails: item.punchInDetails || { address: null },
            punchOutDetails: item.punchOutDetails || { address: null }
          };
        }
      });
      
      console.log("Formatted calendar data:", formattedData);
      setCalendarData(formattedData);
      calculateMonthlySummary(formattedData);
    } else {
      // Direct API data is already in the right format
      console.log("Using API data directly");
      setCalendarData(filteredData);
      calculateMonthlySummary(filteredData);
    }
  };

  // Calculate monthly summary from calendar data
  const calculateMonthlySummary = (data) => {
    if (!data || !Array.isArray(data)) {
      console.error("Cannot calculate summary: data is not an array");
      return;
    }
    
    let presentCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let autoPunchOutCount = 0;
    let totalHours = 0;
    
    data.forEach(day => {
      if (!day) return;
      
      // Get normalized status for consistent comparison
      const normalizedStatus = (day.status || '').toLowerCase();
      
      // Count days by status
      if (normalizedStatus === 'present') {
        presentCount++;
      } else if (normalizedStatus === 'leave' || normalizedStatus === 'on leave') {
        leaveCount++;
      } else if (normalizedStatus === 'absent') {
        absentCount++;
      } else if (normalizedStatus === 'auto-punched-out') {
        autoPunchOutCount++;
      }
      
      // Sum up working hours
      if (day.workingHours && !isNaN(day.workingHours)) {
        totalHours += parseFloat(day.workingHours);
      }
    });
    
    // Update state with the summary
    setMonthlySummary({
      presentDays: presentCount,
      leaveDays: leaveCount,
      absentDays: absentCount,
      autoPunchOutDays: autoPunchOutCount,
      totalWorkingHours: totalHours.toFixed(1)
    });
    
    console.log("Monthly summary calculated:", {
      presentDays: presentCount,
      leaveDays: leaveCount,
      absentDays: absentCount,
      autoPunchOutDays: autoPunchOutCount,
      totalWorkingHours: totalHours.toFixed(1)
    });
  };

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const getStatusColor = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    
    switch (normalizedStatus) {
      case 'present':
        return 'bg-emerald-100';
      case 'leave':
      case 'on leave':
        return 'bg-yellow-100';
      case 'absent':
        return 'bg-red-100';
      case 'weekend':
        return 'bg-blue-100';
      case 'auto-punched-out':
        return 'bg-purple-100';
      default:
        return 'bg-white';
    }
  };

  const getStatusText = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    
    switch (normalizedStatus) {
      case 'present':
        return 'Present';
      case 'inprogress':
      case 'in progress':
        return 'In Progress';
      case 'leave':
      case 'on leave':
        return 'On Leave';
      case 'absent':
        return 'Absent';
      case 'weekend':
        return 'Weekend';
      case 'auto-punched-out':
        return 'Auto Punched-Out';
      default:
        return 'No Data';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "Not Available";
    
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      return timeStr;
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeStr || "Not Available";
    }
  };

  const getDayData = (day) => {
    const dayData = calendarData.find(data => {
      // Some APIs return day as a number, others as a date string
      if (data.day && data.day === day) return true;
      
      // If we have a date string, extract the day from it
      if (data.date) {
        const dateObj = new Date(data.date);
        if (!isNaN(dateObj.getTime())) {
          // Make sure the date is not invalid
          return dateObj.getDate() === day;
        }
      }
      return false;
    });
    
    return dayData;
  };

  const generateCalendarGrid = () => {
    if (!calendarData || !calendarData.length) return [];
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    
    const calendar = [];
    let dayCount = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDayOfMonth) || dayCount > daysInMonth) {
          week.push(null);
        } else {
          const dayData = getDayData(dayCount);
          week.push({
            day: dayCount,
            status: dayData ? dayData.status : 'no-data',
            workingHours: dayData ? dayData.workingHours : 0,
            fullData: dayData
          });
          dayCount++;
        }
      }
      
      calendar.push(week);
      if (dayCount > daysInMonth) break;
    }
    
    return calendar;
  };
  
  const calendarGrid = generateCalendarGrid();

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (preloadedData && preloadedData.length > 0) {
        processAttendanceData(preloadedData);
        return;
      }
      
      const response = await api.get(`/attendance/teacher/${teacherId}/monthly/${currentYear}/${currentMonth}`);
      
      if (!Array.isArray(response.data)) {
        setError("Invalid data format received from server");
        console.error("Invalid data format received:", response.data);
        return;
      }
      
      processAttendanceData(response.data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setError("Failed to load attendance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day) => {
    if (!day) return;
    
    const dayData = day.fullData || {};
    
    setSelectedDay({
      day: day.day,
      status: getStatusText(day.status),
      workingHours: day.workingHours,
      punchIn: formatTime(dayData.punchIn),
      punchOut: formatTime(dayData.punchOut),
      location: dayData.location || "Not Available",
      punchInDetails: dayData.punchInDetails?.address || "Not Available",
      punchOutDetails: dayData.punchOutDetails?.address || "Not Available",
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
    });
  };
  
  // Render the calendar content
  const renderCalendarContent = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-amber-500">{teacherName}'s Attendance</h2>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button 
          type="button"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={previousMonth}
        >
          <ChevronLeft />
        </button>
        
        <h3 className="text-lg font-medium">
          {monthNames[currentMonth - 1]} {currentYear}
        </h3>
        
        <button 
          type="button"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={nextMonth}
        >
          <ChevronRight />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
          <button 
            type="button"
            onClick={fetchMonthlyAttendance} 
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Monthly Summary Card */}
      {!loading && calendarData.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <h4 className="font-medium text-amber-500 mb-2">Monthly Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="bg-emerald-50 p-2 rounded">
              <div className="text-xs text-gray-600">Present Days</div>
              <div className="font-semibold text-emerald-600">{monthlySummary.presentDays}</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="text-xs text-gray-600">Leave Days</div>
              <div className="font-semibold text-amber-600">{monthlySummary.leaveDays}</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="text-xs text-gray-600">Absent Days</div>
              <div className="font-semibold text-red-600">{monthlySummary.absentDays}</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-xs text-gray-600">Auto Punch-out</div>
              <div className="font-semibold text-purple-600">{monthlySummary.autoPunchOutDays}</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-xs text-gray-600">Total Hours</div>
              <div className="font-semibold text-blue-600">{monthlySummary.totalWorkingHours}</div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
          <p className="ml-2">Loading calendar data...</p>
        </div>
      ) : (
        <>
          <div className="w-50% h-[350px] rounded-lg overflow-hidden border border-gray-200">
            <div className="grid grid-cols-7 bg-gray-100">
              {dayNames.map((day, i) => (
                <div 
                  key={i} 
                  className="py-2 text-center text-sm font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {calendarGrid.length > 0 ? (
              calendarGrid.map((week, i) => (
                <div key={i} className="grid grid-cols-7">
                  {week.map((day, j) => (
                    <div 
                      key={j} 
                      className={`min-h-16 p-1 border border-gray-100 ${day ? getStatusColor(day.status) : 'bg-white'} ${day ? 'cursor-pointer hover:opacity-75' : ''}`}
                      onClick={day ? () => handleDayClick(day) : null}
                    >
                      {day && (
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{day.day}</span>
                          </div>
                          {day.workingHours > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{day.workingHours.toFixed(1)}h</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="col-span-7 py-8 text-center text-gray-500">
                No calendar data available for this month
              </div>
            )}
          </div>
          
          {selectedDay && (
            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm mb-2">
                {selectedDay.date}
              </h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${
                    selectedDay.status === 'Present' ? 'text-green-600' :
                    selectedDay.status === 'On Leave' ? 'text-yellow-600' :
                    selectedDay.status === 'Auto Punched-Out' ? 'text-purple-600' :
                    'text-red-600'
                  }`}>{selectedDay.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Working Hours:</span>
                  <span className="font-semibold">{selectedDay.workingHours ? `${parseFloat(selectedDay.workingHours).toFixed(1)} hours` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Punch-in Time:</span>
                  <span className="font-semibold">{selectedDay.punchIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Punch-in Location:</span>
                  <span className="font-semibold text-xs max-w-[200px] text-right">{selectedDay.punchInDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span>Punch-out Time:</span>
                  <span className="font-semibold">{selectedDay.punchOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Punch-out Location:</span>
                  <span className="font-semibold text-xs max-w-[200px] text-right">{selectedDay.punchOutDetails}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  // Return the appropriate component based on whether to show as dialog or inline
  return showAsDialog ? (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent className="relative p-0">
        <IconButton 
          className="absolute right-2 top-2 z-10" 
          onClick={onClose}
        >
          <X />
        </IconButton>
        
        {renderCalendarContent()}
      </DialogContent>
    </Dialog>
  ) : (
    renderCalendarContent()
  );
};

export default TeacherAttendanceCalendar;