import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  InputBase,
  Drawer,
  Button,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';

const MobileAgendaView = ({
  events = [],
  selectedDate,
  onEventClick,
  teachers,
  userRole = 'admin',
  currentTeacherId,
  getEventColor: externalGetEventColor
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupedEvents, setGroupedEvents] = useState({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const theme = useTheme();

  // Update current date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Group events by date
  useEffect(() => {
    const grouped = {};
    
    // Get start and end dates for the current week
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Initialize each day of the week with an empty array
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      grouped[dateKey] = [];
    }
    
    // Filter events based on teacher ID if in teacher role
    const filteredEvents = userRole === 'teacher' && currentTeacherId
      ? events.filter(event => {
          const eventTeacherId = event.teacherId || event.teacher;
          return (
            eventTeacherId === currentTeacherId ||
            event.teacher === currentTeacherId ||
            (typeof eventTeacherId === 'object' && eventTeacherId.id === currentTeacherId) ||
            (typeof event.teacher === 'object' && event.teacher.id === currentTeacherId)
          );
        })
      : events;
    
    console.log('Filtered events for mobile view:', {
      total: events.length,
      filtered: filteredEvents.length,
      userRole,
      currentTeacherId
    });
    
    // Add events to their respective days
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (grouped[dateKey]) {
        // Sort events by start time
        grouped[dateKey].push(event);
        grouped[dateKey].sort((a, b) => {
          const aTime = a.startTime.split(':').map(Number);
          const bTime = b.startTime.split(':').map(Number);
          return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
        });
      }
    });
    
    setGroupedEvents(grouped);
  }, [events, currentDate, userRole, currentTeacherId]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).toUpperCase();
  };

  // Get day number
  const getDayNumber = (dateString) => {
    return new Date(dateString).getDate();
  };

  // Check if date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Check if event has ended
  const isEventEnded = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    eventDate.setHours(endHour, endMinute);
    return now > eventDate;
  };

  // Check if event is in future
  const isEventFuture = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    eventDate.setHours(startHour, startMinute);
    return now < eventDate;
  };

  // Check if event is currently active
  const isEventActive = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    eventDate.setHours(startHour, startMinute);
    const endDate = new Date(eventDate);
    endDate.setHours(endHour, endMinute);
    return now >= eventDate && now <= endDate;
  };

  // Local getEventColor function as fallback
  const getEventColor = (event) => {
    if (externalGetEventColor) {
      return externalGetEventColor(event);
    }

    if (isEventEnded(event)) {
      return '#E0E0E0'; // Gray for past events
    }
    
    // For future or active events, use assigned colors
    if (event.teacherId && teachers) {
      const teacher = teachers.find(t => t.id === event.teacherId);
      if (teacher && teacher.color) {
        return teacher.color;
      }
    }
    
    return event.color || '#1a73e8';
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'; // Handle undefined or null timeString
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour = hours % 12 || 12;
      return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return 'Invalid time';
    }
  };

  // Get teacher for an event
  const getTeacherForEvent = (event) => {
    if (!event.teacherId || !teachers) return null;
    return teachers.find(t => t.id === event.teacherId);
  };

  // Toggle calendar drawer
  const toggleCalendar = () => {
    setCalendarOpen(!calendarOpen);
  };

  // Handle date selection
  const handleDateSelection = (date) => {
    setCurrentDate(new Date(date));
    setCalendarOpen(false);
  };

  // Generate dates for the simple calendar
  const generateCalendarDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const dates = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(today.getFullYear(), today.getMonth(), i));
    }
    
    return dates;
  };

  // Render a single event
  const renderEvent = (event) => {
    // Get teacher data if available
    const teacher = teachers.find((t) => t.id === event.teacherId || t.id === event.teacher);
    
    // Get event color (use teacher color if available, otherwise use event color or default)
    const eventColor = teacher ? teacher.color : (event.color || '#4285F4');
    
    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return '';
      
      try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (isNaN(hour) || isNaN(minute)) return timeString;
        
        // Convert to 12-hour format
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
      }
    };
    
    // Format start and end times
    const startTime = formatTime(event.startTime);
    const endTime = event.endTime ? formatTime(event.endTime) : '';
    const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
    
    // Get teacher name (use display name if available, otherwise use ID)
    const teacherName = teacher ? teacher.name : (event.teacherName || 'Unknown Teacher');
    
    return (
      <Paper
        key={event.id || event._id}
        onClick={() => onEventClick && onEventClick(event)}
        sx={{
          mb: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: eventColor,
          color: isEventEnded(event) ? '#757575' : '#000',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            filter: 'brightness(0.95)',
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold',
          color: isEventEnded(event) ? '#757575' : '#000'
        }}>
          {event.title}
        </Typography>
        
        <Typography variant="body2" sx={{ 
          mt: 0.5,
          color: isEventEnded(event) ? '#757575' : '#000'
        }}>
          {event.startTime && event.endTime ? 
            `${formatTime(event.startTime)}–${formatTime(event.endTime)}` : 
            'Time not specified'}
        </Typography>
        
        {event.description && (
          <Typography variant="body2" sx={{ 
            mt: 0.5,
            color: isEventEnded(event) ? '#757575' : '#000',
            opacity: 0.9
          }}>
            {event.description}
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'white', color: '#333' }}>
      {/* Header with month, search and avatar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f5f5f5'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            onClick={toggleCalendar}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#555', 
                fontWeight: 'medium',
              }}
            >
              {currentDate.toLocaleDateString('en-US', { month: 'long' })}
            </Typography>
            <KeyboardArrowDownIcon 
              fontSize="small" 
              sx={{ color: '#555', ml: '2px' }} 
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" sx={{ color: '#555', mr: 1 }}>
            <SearchIcon />
          </IconButton>
          
          <IconButton size="small" sx={{ p: 0 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: '#f57c00',
                fontSize: '0.875rem'
              }}
            >
              A
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      {/* Date navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'white'
      }}>
        <IconButton onClick={handlePreviousWeek} sx={{ color: '#555' }}>
          <NavigateBeforeIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'medium',
              color: '#333'
            }}
          >
            {currentDate.toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Typography>
          
          <IconButton onClick={handleToday} sx={{ ml: 1, color: '#555' }}>
            <TodayIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <IconButton onClick={handleNextWeek} sx={{ color: '#555' }}>
          <NavigateNextIcon />
        </IconButton>
      </Box>

      {/* Events list grouped by date */}
      <Box sx={{ p: 2, bgcolor: 'white' }}>
        {Object.keys(groupedEvents).map((dateKey) => (
          <Box key={dateKey} sx={{ mb: 3, bgcolor: 'white' }}>
            {/* Date header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 1,
              bgcolor: 'white'
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mr: 2,
                bgcolor: 'white'
              }}>
                <Typography variant="caption" sx={{ color: '#333', fontWeight: 'bold' }}>
                  {formatDate(dateKey).split(' ')[0]}
                </Typography>
                
                <Avatar 
                  sx={{ 
                    bgcolor: isToday(dateKey) ? '#1a73e8' : 'transparent',
                    color: isToday(dateKey) ? 'white' : '#333',
                    width: 36, 
                    height: 36,
                    border: isToday(dateKey) ? 'none' : '1px solid #999',
                    fontWeight: 'bold'
                  }}
                >
                  {getDayNumber(dateKey)}
                </Avatar>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: '#999' }} />
              
              {groupedEvents[dateKey].length === 0 ? (
                <Typography variant="body2" sx={{ color: '#333', ml: 2, fontWeight: 'medium' }}>
                  No events scheduled
                </Typography>
              ) : null}
            </Box>
            
            {/* Events for this date */}
            {groupedEvents[dateKey].map((event, index) => (
              renderEvent(event)
            ))}
          </Box>
        ))}
      </Box>

      {/* Simple Calendar Drawer */}
      <Drawer
        anchor="top"
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            borderRadius: '0 0 16px 16px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Select Date</Typography>
            <IconButton onClick={() => setCalendarOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Simple calendar implementation without external dependencies */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
              mb: 2
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#555'
                  }}
                >
                  {day}
                </Box>
              ))}
              
              {generateCalendarDates().map((date, index) => {
                const isSelectedDate = 
                  date.getDate() === currentDate.getDate() && 
                  date.getMonth() === currentDate.getMonth() && 
                  date.getFullYear() === currentDate.getFullYear();
                
                const isTodayDate = 
                  date.getDate() === new Date().getDate() && 
                  date.getMonth() === new Date().getMonth() && 
                  date.getFullYear() === new Date().getFullYear();
                
                // Add empty cells for days before the first day of the month
                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
                const emptyCells = index === 0 ? Array(firstDayOfMonth).fill(null) : [];
                
                return (
                  <React.Fragment key={index}>
                    {index === 0 && emptyCells.map((_, i) => (
                      <Box key={`empty-${i}`} />
                    ))}
                    <Box 
                      onClick={() => handleDateSelection(date)}
                      sx={{ 
                        textAlign: 'center',
                        p: 1,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        bgcolor: isSelectedDate ? theme.palette.primary.main : 'transparent',
                        color: isSelectedDate ? 'white' : isTodayDate ? theme.palette.primary.main : 'inherit',
                        fontWeight: isTodayDate ? 'bold' : 'normal',
                        border: isTodayDate && !isSelectedDate ? `1px solid ${theme.palette.primary.main}` : 'none',
                        '&:hover': {
                          bgcolor: isSelectedDate ? theme.palette.primary.main : '#f5f5f5',
                        }
                      }}
                    >
                      {date.getDate()}
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => {
                setCurrentDate(new Date());
                setCalendarOpen(false);
              }}
              sx={{ mr: 1 }}
            >
              Today
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setCalendarOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MobileAgendaView;