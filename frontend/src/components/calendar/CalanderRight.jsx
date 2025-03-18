import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TodayIcon from '@mui/icons-material/Today';
import Month from './Month';
import Week from './Week';
import NewEventForm from './NewEventForm';
import TaskDetailsModal from './TaskDetailsModal';
import SearchIcon from '@mui/icons-material/Search';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import MobileAgendaView from './MobileAgendaView';
import PropTypes from 'prop-types';

const CalanderRight = ({
  events = [],
  selectedDate,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  teachers,
  viewMode = 'Month',
  onViewChange,
  isIPhoneSE = false,
  isMobile = false,
  userRole = 'admin',
  currentUserId = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openEventForm, setOpenEventForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clickedWhatsAppEvents, setClickedWhatsAppEvents] = useState({}); // Add state to track clicked WhatsApp icons
  const [sentEvents, setSentEvents] = useState({}); // Add state to track events marked as sent
  const [userEmail, setUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  // Get user email from localStorage on component mount
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
    
    const name = localStorage.getItem('userName');
    if (name) {
      setCurrentUserName(name);
    }
  }, []);

  // Add a ref for the day view container to enable scrolling
  const dayViewRef = React.useRef(null);

  // Function to scroll to current time
  const scrollToCurrentTime = useCallback(() => {
    if (viewMode === 'Day' && dayViewRef.current) {
      // Add a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        
        // Calculate position: 80px header + 60px per hour
        const timePosition = ((currentHour + currentMinute / 60) * 60) + 80; // 80px is header height
        
        // Get the container's height
        const containerHeight = dayViewRef.current.clientHeight;
        
        // Calculate scroll position to center the current time
        const scrollPosition = timePosition - (containerHeight / 2);
        
        // Scroll to the calculated position with smooth animation
        dayViewRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [viewMode, currentTime, dayViewRef]);

  // Auto-scroll to center the current time when in Day view
  useEffect(() => {
    scrollToCurrentTime();
  }, [scrollToCurrentTime]);

  // Also scroll to center the current time when the date changes
  useEffect(() => {
    if (viewMode === 'Day') {
      // Small delay to ensure the view has updated for the new date
      setTimeout(() => {
        scrollToCurrentTime();
      }, 100);
    }
  }, [currentDate, viewMode, scrollToCurrentTime]);

  // Handle window resize to maintain centered current time
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'Day') {
        scrollToCurrentTime();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, scrollToCurrentTime]);

  // Format date to display month and year
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Format date for the day view
  const formatDay = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Navigate to previous period (day, week, month)
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'Week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'Month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period (day, week, month)
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'Week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'Month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Change view mode (day, week, month)
  const handleViewChange = (mode) => {
    if (onViewChange) {
      onViewChange(mode);
    }
  };

  // Helper function to normalize date objects or strings to Date objects
  const normalizeDate = (dateInput) => {
    if (!dateInput) return null;
    return dateInput instanceof Date ? dateInput : new Date(dateInput);
  };

  // Helper function to normalize date objects or strings to Date objects for comparison
  const normalizeDateForComparison = (dateInput) => {
    const date = normalizeDate(dateInput);
    if (!date) return null;
    return new Date(date.toISOString().split('T')[0]);
  };

  // Compare two dates (ignoring time)
  const isSameDay = (date1, date2) => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    if (!d1 || !d2) return false;

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Compare two dates (ignoring time) for comparison
  const isSameDayForComparison = (date1, date2) => {
    const d1 = normalizeDateForComparison(date1);
    const d2 = normalizeDateForComparison(date2);
    if (!d1 || !d2) return false;

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Check if an event is in the future
  const isEventFuture = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    eventDate.setHours(startHour, startMinute);
    return now < eventDate;
  };

  // Check if event has ended
  const isEventEnded = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    eventDate.setHours(endHour, endMinute);
    return now > eventDate;
  };

  // Check if teacher matches the event - updated to prioritize teacher name
  const isTeacherMatch = (event, teacher) => {
    if (!event || !teacher) return false;
    
    // Prioritize matching by teacher name
    const eventTeacherName = event.teacher || '';
    const teacherName = teacher.name || '';
    
    // Fall back to ID matching for backward compatibility
    const eventTeacherId = event.teacherId || '';
    const teacherId = teacher.id || '';
    
    // Check various possible matches with name as priority
    return (
      // Primary match by name
      eventTeacherName === teacherName ||
      // Fallback matches for backward compatibility
      eventTeacherId === teacherId ||
      event.teacherId === teacherName ||
      (typeof event.teacher === 'object' && event.teacher?.name === teacherName) ||
      (typeof event.teacher === 'object' && event.teacher?.id === teacherId)
    );
  };

  // Check if event belongs to the current user (for teacher role)
  const isCurrentUserEvent = (event) => {
    if (!event || userRole !== 'teacher') return true;
    
    // Try to match by name first (most reliable)
    if (userName) {
      const eventTeacherName = event.teacher || '';
      
      if (eventTeacherName && eventTeacherName.toLowerCase() === userName.toLowerCase()) {
        return true;
      }
    }
    
    // Fall back to ID matching for backward compatibility
    if (currentUserId) {
      const eventTeacherId = event.teacherId || '';
      if (eventTeacherId === currentUserId) {
        return true;
      }
    }
    
    // Try to match by exact email
    if (userEmail) {
      const eventTeacherEmail = event.teacherEmail || (typeof event.teacher === 'object' ? event.teacher?.email : '');
      if (eventTeacherEmail && eventTeacherEmail.toLowerCase() === userEmail.toLowerCase()) {
        return true;
      }
    }
    
    // As a last resort, check for username in teacher name or vice versa
    // But only if the match is very specific (to avoid false positives)
    if (userName) {
      const eventTeacherName = event.teacher || '';
      
      if (eventTeacherName) {
        // Only consider this a match if one is fully contained in the other
        // and they share at least 5 characters (to avoid matching short names like "test")
        const userNameLower = userName.toLowerCase();
        const teacherNameLower = eventTeacherName.toLowerCase();
        
        // Check if one contains the other completely
        const nameContainedInTeacher = teacherNameLower.includes(userNameLower) && userNameLower.length >= 5;
        const teacherContainedInName = userNameLower.includes(teacherNameLower) && teacherNameLower.length >= 5;
        
        if (nameContainedInTeacher || teacherContainedInName) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Get event color based on its timing
  const getEventColor = (event) => {
    // Check if event has ended (past event)
    if (isEventEnded(event)) {
      return '#E0E0E0'; // Gray for past events
    }
    
    // For future or active events, use their assigned colors
    if (event.teacherId && teachers) {
      const teacher = teachers.find(t => t.id === event.teacherId);
      if (teacher && teacher.color) {
        return teacher.color;
      }
    }
    
    // If no teacher color, use event color or default
    return event.color || '#1a73e8';
  };

  // Filter events for the current month - modified to show only teacher's events if user is a teacher
  const getMonthEvents = () => {
    // First filter by month
    const monthEvents = events.filter((event) => {
      try {
        const eventDate = normalizeDate(event.date);
        return (
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getFullYear() === currentDate.getFullYear()
        );
      } catch (error) {
        console.error('Error filtering month events:', error, event);
        return false;
      }
    });

    // Then filter by user role if needed
    if (userRole === 'teacher') {
      return monthEvents.filter(isCurrentUserEvent);
    }

    return monthEvents;
  };

  // Filter events for the current week
  const getWeekEvents = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // First filter by week
    const weekEvents = events.filter((event) => {
      const eventDate = normalizeDate(event.date);
      if (!eventDate) return false;

      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // Then filter by user role if needed
    if (userRole === 'teacher') {
      return weekEvents.filter(isCurrentUserEvent);
    }

    return weekEvents;
  };

  // Filter events for the current day - modified to show only teacher's events if user is a teacher
  const getDayEvents = () => {
    // First filter by day
    const dayEvents = events.filter((event) => {
      try {
        const eventDate = normalizeDate(event.date);
        return isSameDay(eventDate, currentDate);
      } catch (error) {
        console.error('Error filtering day events:', error, event);
        return false;
      }
    });

    // Then filter by user role if needed
    if (userRole === 'teacher') {
      return dayEvents.filter(isCurrentUserEvent);
    }

    return dayEvents;
  };

  // Handle opening the event form
  const handleOpenEventForm = (hour, teacherId = null) => {
    // Don't open the form for teachers
    if (userRole === 'teacher') {
      return;
    }
    
    // Format the hour to HH:MM format
    const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedTime(formattedHour);
    setSelectedTeacherId(teacherId);
    setOpenEventForm(true);
  };

  // Handle closing the event form
  const handleCloseEventForm = () => {
    setOpenEventForm(false);
  };

  // Handle submitting the event form
  const handleSubmitEvent = (eventData) => {
    handleCloseEventForm(); // Close the form
    if (onAddEvent) {
      onAddEvent({
        ...eventData,
        date: new Date(eventData.date).toISOString(), // Ensure date is formatted correctly
      });
    }
  };

  //handle event for whatspp
  const handleWhatsAppClick = (event) => {
    // Toggle the clicked state for this event
    setClickedWhatsAppEvents((prev) => ({
      ...prev,
      [event.id]: !prev[event.id],
    }));

    // Only proceed with WhatsApp sharing if the icon hasn't been clicked before
    if (!clickedWhatsAppEvents[event.id]) {
      // Format date and time
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });

      // Convert 24-hour format to 12-hour format with AM/PM
      const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };

      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);

      // Find teacher name
      const teacher = teachers.find(t => t.id === event.teacherId);
      const teacherName = teacher ? teacher.name : 'Admin';

      // Format the message with emojis and proper alignment
      const message = `📅 Date: ${formattedDate}
⏰ Time: ${startTime} - ${endTime}

📍 Location: ${event.location || 'North Campus'}
👨‍🏫 Teacher: ${teacherName}
📖 Subject: ${event.subject || 'Chemistry'}
🏢 Branch: ${event.branch || 'Main Branch'}`


      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  

  // Handle marking an event as sent
  const handleMarkAsSent = (event) => {
    setSentEvents((prev) => ({
      ...prev,
      [event.id]: true,
    }));
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setOpenTaskModal(true);
  };

  // Handle task update
  const handleTaskUpdate = (updatedTask) => {
    if (onUpdateEvent) {
      onUpdateEvent(updatedTask);
    }
    setOpenTaskModal(false);
  };

  // Handle task deletion
  const handleTaskDelete = (taskId) => {
    if (onDeleteEvent) {
      onDeleteEvent(taskId);
    }
    setOpenTaskModal(false);
  };

  // Render day view events
  const renderDayViewEvent = (event, teacher, onLeave, isIPhoneSE) => {
    // Ensure we have string values for title and description
    const title = typeof event.title === 'string' ? event.title : 
                 (event.title ? String(event.title) : 'Untitled Event');
    const description = typeof event.description === 'string' ? event.description : 
                       (event.description ? String(event.description) : '');
    
    return (
      <Paper
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(event);
        }}
        sx={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          height: 'calc(100% - 4px)',
          backgroundColor: getEventColor(event),
          color: isEventEnded(event) ? '#757575' : 'white',
          p: isIPhoneSE ? 0.5 : 1,
          borderRadius: '4px',
          fontSize: isIPhoneSE ? '0.65rem' : '0.75rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          zIndex: 1,
          cursor: 'pointer',
          '&:hover': {
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            filter: 'brightness(0.95)',
          },
          opacity: onLeave ? 0.6 : 1,
          ...(onLeave && {
            filter: 'grayscale(30%)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
          }),
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="caption"
          sx={{ 
            fontWeight: 'bold',
            fontSize: isIPhoneSE ? '0.6rem' : '0.7rem'
          }}
          noWrap
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            sx={{ 
              fontSize: isIPhoneSE ? '0.55rem' : '0.65rem',
              opacity: 0.9
            }}
            noWrap
          >
            {description}
          </Typography>
        )}
      </Paper>
    );
  };

  // Render month view
  const renderMonthView = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Month currentDate={currentDate} events={getMonthEvents()} />
        </Box>
      </Box>
    );
  };

  // Render week view
  const renderWeekView = () => {
    return (
      <Box sx={{ height: 'calc(100vh - 130px)', overflowY: 'auto' }}>
        <Week currentDate={currentDate} events={getWeekEvents()} />
      </Box>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const activeTeachers = teachers
      ? teachers.filter((teacher) => teacher.checked)
      : [];

    // For iPhone SE, limit the number of visible teachers
    const visibleTeachers = isIPhoneSE ? 
      (activeTeachers.length > 0 ? [activeTeachers[2]] : []) : 
      activeTeachers;

    // Calculate current time position
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const timePosition = ((currentHour + currentMinute / 60) * 60) + 80; // 80px is header height

    return (
      <Box
        ref={dayViewRef}
        sx={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              visibleTeachers.length > 0
                ? `80px repeat(${visibleTeachers.length}, minmax(120px, 1fr))`
                : '80px 1fr',
            gridTemplateRows: `80px repeat(${hours.length}, 60px)`,
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            minWidth:
              visibleTeachers.length > 3 && !isIPhoneSE
                ? 80 + visibleTeachers.length * 150 + 'px'
                : '100%',
            height: 'max-content',
            position: 'relative',
          }}
        >
          {/* Current time indicator - only show in Day view */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${timePosition}px`,
              height: '2px',
              backgroundColor: '#f44336',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease-in-out',
              width: isIPhoneSE ? 'calc(100% - 2px)' : '100%', // Adjust width for iPhone SE border
              '&::before': {
                content: '""',
                position: 'absolute',
                left: isIPhoneSE ? '70px' : '72px',
                top: '-4px',
                width: isIPhoneSE ? '6px' : '8px',
                height: isIPhoneSE ? '6px' : '8px',
                backgroundColor: '#f44336',
                borderRadius: '50%',
                boxShadow: '0 0 4px rgba(244, 67, 54, 0.5)',
              },
              // Move the time display above the line instead of to the left
              '&::after': {
                content: `"${currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true 
                })}"`,
                position: 'absolute',
                left: '50%', // Center horizontally
                top: '-20px', // Position above the line
                transform: 'translateX(-50%)', // Center the text
                fontSize: isIPhoneSE ? '0.6rem' : '0.75rem',
                fontWeight: 'bold',
                color: '#f44336',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: isIPhoneSE ? '1px 3px' : '2px 4px',
                borderRadius: '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                lineHeight: 1,
              }
            }}
          />

          {/* Header row - now with sticky positioning */}
          <Box
            sx={{
              display: 'contents',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              '& > *': {
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }
            }}
          >
            {/* Empty top-left cell */}
            <Box
              sx={{
                gridColumn: '1 / 2',
                gridRow: '1 / 2',
                borderRight: '1px solid #e0e0e0',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                p: isIPhoneSE ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Time
              </Typography>
            </Box>

            {/* Teacher Headers - only show if there are visible teachers */}
            {visibleTeachers.length > 0 ? (
              visibleTeachers.map((teacher, index) => {
                return (
                  <Box
                    key={teacher.id}
                    sx={{
                      gridColumn: `${index + 2} / ${index + 3}`,
                      gridRow: '1 / 2',
                      borderRight:
                        index < visibleTeachers.length - 1
                          ? '1px solid #e0e0e0'
                          : 'none',
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f5',
                      p: isIPhoneSE ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      transition: 'all 0.2s ease-in-out',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: isIPhoneSE ? 30 : 40,
                        height: isIPhoneSE ? 30 : 40,
                        borderRadius: '50%',
                        backgroundColor: teacher.color || '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        mb: isIPhoneSE ? 0.5 : 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: isIPhoneSE ? '0.7rem' : '0.8rem',
                      }}
                    >
                      {teacher.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: 'text.primary',
                        fontSize: isIPhoneSE ? '0.7rem' : '0.8rem'
                      }}
                      noWrap
                    >
                      {teacher.name}
                    </Typography>
                  </Box>
                );
              })
            ) : (
              // Empty header when no teachers are selected
              <Box
                sx={{
                  gridColumn: '2 / 3',
                  gridRow: '1 / 2',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No teachers selected
                </Typography>
              </Box>
            )}
          </Box>

          {/* Hour cells - always show */}
          {hours.map((hour) => {
            return (
              <React.Fragment key={hour}>
                {/* Hour label */}
                <Box
                  sx={{
                    gridColumn: '1 / 2',
                    gridRow: `${hour + 2} / ${hour + 3}`,
                    borderRight: '1px solid #e0e0e0',
                    borderBottom: hour < 23 ? '1px solid #e0e0e0' : 'none',
                    backgroundColor: '#f5f5f5',
                    p: isIPhoneSE ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: isIPhoneSE ? '0.7rem' : '0.8rem' }}>
                    {hour === 0
                      ? '12 AM'
                      : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                      ? '12 PM'
                      : `${hour - 12} PM`}
                  </Typography>
                </Box>

                {/* Teacher cells - only show if there are visible teachers */}
                {visibleTeachers.length > 0 ? (
                  visibleTeachers.map((teacher, index) => {
                    // Find events for this teacher at this hour
                    const hourEvents = events.filter((event) => {
                      try {
                        const timeParts = event.startTime.split(':');
                        const eventHour = parseInt(timeParts[0], 10);
                        const eventDate = normalizeDateForComparison(event.date);
                        const currentDateNormalized = normalizeDateForComparison(currentDate);

                        // Check if event is for this teacher and hour
                        return (
                          !isNaN(eventHour) &&
                          eventHour === hour &&
                          isTeacherMatch(event, teacher) &&
                          isSameDayForComparison(eventDate, currentDateNormalized)
                        );
                      } catch (error) {
                        console.error('Error processing event:', error, event);
                        return false;
                      }
                    });

                    return (
                      <Box
                        key={`${hour}-${teacher.id}`}
                        sx={{
                          gridColumn: `${index + 2} / ${index + 3}`,
                          gridRow: `${hour + 2} / ${hour + 3}`,
                          p: 0.5,
                          borderRight:
                            index < visibleTeachers.length - 1
                              ? '1px solid #e0e0e0'
                              : 'none',
                          borderBottom:
                            hour < 23 ? '1px solid #e0e0e0' : 'none',
                          minHeight: isIPhoneSE ? '50px' : '60px',
                          position: 'relative',
                          cursor: userRole !== 'teacher' ? 'pointer' : 'default', // Only show pointer cursor for non-teachers
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onClick={() => {
                          // Always allow creating events, even if teacher is on leave
                          handleOpenEventForm(hour, teacher.id);
                        }}
                      >
                        {/* Display events in this cell */}
                        {hourEvents.map((event, eventIndex) => {
                          // Generate a unique key for each event
                          const eventKey = typeof event.id === 'string' ? event.id : 
                                         (typeof event._id === 'string' ? event._id : 
                                         `event-${teacher.id}-${hour}-${eventIndex}`);
                          
                          return (
                            <React.Fragment key={eventKey}>
                              {renderDayViewEvent(event, teacher, false, isIPhoneSE)}
                            </React.Fragment>
                          );
                        })}
                      </Box>
                    );
                  })
                ) : (
                  // Empty cell when no teachers are selected
                  <Box
                    key={`${hour}-empty`}
                    sx={{
                      gridColumn: '2 / 3',
                      gridRow: `${hour + 2} / ${hour + 3}`,
                      borderBottom: hour < 23 ? '1px solid #e0e0e0' : 'none',
                      minHeight: isIPhoneSE ? '50px' : '60px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                    onClick={() => {
                      // When clicking on an empty cell with no teachers, show a message
                      alert(
                        'Please select at least one teacher from the sidebar to create an event.',
                      );
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    // Filter events based on search term
    const filteredEvents = events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description &&
          event.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    return (
      <Box sx={{ p: isIPhoneSE ? 1 : 2 }}>
        <Typography variant="h6" component="div" sx={{ fontSize: isIPhoneSE ? '1.1rem' : '1.25rem' }}>Agenda View</Typography>

        {/* Search input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { mb: 2, mt: 2 },
          }}
          size="small"
        />

        {/* Display filtered events in a list */}
        {filteredEvents.length === 0 ? (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            {searchTerm ? 'No matching events found' : 'No events scheduled'}
          </Typography>
        ) : (
          filteredEvents.map((event, index) => (
            <Paper
              key={index}
              sx={{
                p: isIPhoneSE ? 1 : 2,
                mb: 2,
                borderLeft: `4px solid ${getEventColor(event)}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isIPhoneSE ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isIPhoneSE ? 'flex-start' : 'flex-start',
                }}
              >
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: isIPhoneSE ? '0.9rem' : '1rem'
                    }}
                  >
                    {event.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: isIPhoneSE ? '0.75rem' : '0.875rem'
                    }}
                  >
                                        {normalizeDate(event.date)?.toLocaleDateString()} •{' '}
                    {event.startTime} - {event.endTime}
                  </Typography>
                  {event.description && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1,
                        fontSize: isIPhoneSE ? '0.75rem' : '0.875rem'
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center',
                    mt: isIPhoneSE ? 1 : 0
                  }}
                >
                  {/* WhatsApp icon for sending messages */}
                  <WhatsAppIcon
                    sx={{
                      color: '#25D366',
                      cursor: 'pointer',
                      fontSize: isIPhoneSE ? 30 : 40,
                    }}
                    onClick={() => handleWhatsAppClick(event)}
                  />

                  {/* Tick icon that changes to "Sent" when clicked */}
                  {sentEvents[event.id] ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#4CAF50',
                        fontWeight: 'bold',
                        fontSize: isIPhoneSE ? '14px' : '16px',
                      }}
                    >
                      Sent
                    </Typography>
                  ) : (
                    <TaskAltIcon
                      sx={{
                        color: '#f44336',
                        cursor: 'pointer',
                        fontSize: isIPhoneSE ? 30 : 40,
                      }}
                      onClick={() => handleMarkAsSent(event)}
                    />
                  )}
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    );
  };

  // Render the current view based on viewMode
  const renderCurrentView = () => {
    // For small devices, always use the mobile agenda view
    if (isIPhoneSE) {
      
      return (
        <MobileAgendaView
          events={events}
          selectedDate={currentDate}
          onEventClick={handleEventClick}
          onAddEvent={() => handleOpenEventForm(new Date().getHours())}
          teachers={teachers}
          userRole={userRole}
          currentTeacherId={currentUserId}
          currentUserName={currentUserName}
          currentUserEmail={userEmail}
        />
      );
    }

    // For larger devices, use the regular views
    switch (viewMode) {
      case 'Month':
        return renderMonthView();
      case 'Week':
        return renderWeekView();
      case 'Day':
        return (
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {renderDayView()}
          </Box>
        );
      case 'Agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  // Add an effect to update events periodically
  useEffect(() => {
    // Force re-render every minute to update event colors
    const interval = setInterval(() => {
      setCurrentDate(new Date(currentDate)); // This will trigger a re-render
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentDate]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: isIPhoneSE ? '100vw' : '82vw',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation - simplified for iPhone SE */}
      {userRole !== 'teacher' &&
            <Paper
            elevation={0}
            sx={{
              p: isIPhoneSE ? 1 : 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {/* Left side - Today button and navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Hide Today button on iPhone SE */}
              {!isIPhoneSE && (
                <Button
                  onClick={handleToday}
                  sx={{
                    textTransform: 'none',
                    px: 3,
                    borderColor: viewMode === 'Today' ? 'transparent' : '#e0e0e0',
                    backgroundColor: viewMode === 'Today' ? '#000066' : 'white',
                    color: viewMode === 'Today' ? 'white' : '#000066',
                    '&:hover': {
                      backgroundColor: viewMode === 'Today' ? '#000066' : '#f5f5f5',
                      borderColor: viewMode === 'Today' ? 'transparent' : '#e0e0e0',
                    },
                    fontWeight: 'bold',
                  }}
                >
                  Today
                </Button>
              )}
    
              <IconButton onClick={handlePrevious} size="small">
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
    
              <IconButton onClick={handleNext} size="small" sx={{ mr: 2 }}>
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
    
              <Typography variant="h6" component="div" sx={{ fontWeight: 'normal', fontSize: isIPhoneSE ? '0.9rem' : 'inherit' }}>
                {viewMode === 'Day'
                  ? formatDay(currentDate)
                  : formatMonthYear(currentDate)}
              </Typography>
            </Box>
    
            {/* Right side - View mode buttons - hide for teachers */}
            {userRole !== 'teacher' && (
              <Box sx={{ display: 'flex' }}>
                <ButtonGroup
                  variant="outlined"
                  sx={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Button
                    onClick={() => handleViewChange('Day')}
                    sx={{
                      textTransform: 'none',
                      px: isIPhoneSE ? 1 : 3,
                      fontSize: isIPhoneSE ? '0.7rem' : 'inherit',
                      borderColor: viewMode === 'Day' ? 'transparent' : '#e0e0e0',
                      backgroundColor: viewMode === 'Day' ? '#000066' : 'white',
                      color: viewMode === 'Day' ? 'white' : '#000066',
                      '&:hover': {
                        backgroundColor: viewMode === 'Day' ? '#000066' : '#f5f5f5',
                        borderColor: viewMode === 'Day' ? 'transparent' : '#e0e0e0',
                      },
                      fontWeight: 'bold',
                    }}
                  >
                    Day
                  </Button>
    
                  <Button
                    onClick={() => handleViewChange('Week')}
                    sx={{
                      textTransform: 'none',
                      px: isIPhoneSE ? 1 : 3,
                      fontSize: isIPhoneSE ? '0.7rem' : 'inherit',
                      borderColor: viewMode === 'Week' ? 'transparent' : '#e0e0e0',
                      backgroundColor: viewMode === 'Week' ? '#3366cc' : 'white',
                      color: viewMode === 'Week' ? 'white' : '#3366cc',
                      '&:hover': {
                        backgroundColor: viewMode === 'Week' ? '#3366cc' : '#f5f5f5',
                        borderColor: viewMode === 'Week' ? 'transparent' : '#e0e0e0',
                      },
                      fontWeight: 'bold',
                    }}
                  >
                    Week
                  </Button>
    
                  <Button
                    onClick={() => handleViewChange('Month')}
                    sx={{
                      textTransform: 'none',
                      px: isIPhoneSE ? 1 : 3,
                      fontSize: isIPhoneSE ? '0.7rem' : 'inherit',
                      borderColor: viewMode === 'Month' ? 'transparent' : '#e0e0e0',
                      backgroundColor: viewMode === 'Month' ? '#ffcc00' : 'white',
                      color: viewMode === 'Month' ? '#000000' : '#ffcc00',
                      '&:hover': {
                        backgroundColor: viewMode === 'Month' ? '#ffcc00' : '#f5f5f5',
                        borderColor: viewMode === 'Month' ? 'transparent' : '#e0e0e0',
                      },
                      fontWeight: 'bold',
                    }}
                  >
                    Month
                  </Button>
    
                  <Button
                    onClick={() => handleViewChange('Agenda')}
                    sx={{
                      textTransform: 'none',
                      px: isIPhoneSE ? 1 : 3,
                      fontSize: isIPhoneSE ? '0.7rem' : 'inherit',
                      borderColor: viewMode === 'Agenda' ? 'transparent' : '#e0e0e0',
                      backgroundColor: viewMode === 'Agenda' ? '#000066' : 'white',
                      color: viewMode === 'Agenda' ? 'white' : '#000066',
                      '&:hover': {
                        backgroundColor:
                          viewMode === 'Agenda' ? '#000066' : '#f5f5f5',
                        borderColor:
                          viewMode === 'Agenda' ? 'transparent' : '#e0e0e0',
                      },
                      fontWeight: 'bold',
                    }}
                  >
                    Agenda
                  </Button>
                </ButtonGroup>
              </Box>
            )}
          </Paper>}

      {/* Calendar Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: 'calc(100vh - 130px)',
        }}
      >
        {renderCurrentView()}
      </Box>

      {/* New Event Form Dialog */}
      <NewEventForm
        open={openEventForm}
        onClose={handleCloseEventForm}
        onSubmit={handleSubmitEvent}
        initialDate={currentDate.toISOString().split('T')[0]}
        initialTime={selectedTime}
        teachers={teachers}
        initialTeacherId={selectedTeacherId}
      />

      {viewMode === 'Day' && (
        <TaskDetailsModal
          open={openTaskModal}
          onClose={() => setOpenTaskModal(false)}
          task={selectedEvent}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          userRole={userRole}
        />
      )}
    </Box>
  );
};

// PropTypes for type checking
CalanderRight.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      teacherId: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  selectedDate: PropTypes.instanceOf(Date),
  onAddEvent: PropTypes.func,
  onUpdateEvent: PropTypes.func,
  onDeleteEvent: PropTypes.func,
  teachers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      checked: PropTypes.bool,
      color: PropTypes.string,
    })
  ),
  viewMode: PropTypes.string,
  onViewChange: PropTypes.func,
  isIPhoneSE: PropTypes.bool,
  isMobile: PropTypes.bool,
  userRole: PropTypes.string, // User role prop type
  currentUserId: PropTypes.string, // Current user ID prop type
};

export default CalanderRight;