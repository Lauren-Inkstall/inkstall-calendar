import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  useTheme,
  InputBase,
  Drawer,
  Button,
  Stack,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import TaskDetailsMobile from './TaskDetailsMobile';

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
  const [viewType, setViewType] = useState('agenda');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  // Handle view type change
  const handleViewChange = (event) => {
    setViewType(event.target.value);
  };

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

  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    setSelectedEvent(event);
    setDetailsOpen(true);
    // Don't call the external onEventClick to prevent double modals
    // if (onEventClick) {
    //   onEventClick(event);
    // }
  };

  // Close event details modal
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'white', color: '#333' }}>
      {/* Header with view selector and avatar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f5f5f5'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* View Type Dropdown */}
          <Select
            value={viewType}
            onChange={handleViewChange}
            size="small"
            sx={{
              minWidth: 120,
              '& .MuiSelect-select': {
                py: 1,
                bgcolor: 'white'
              }
            }}
          >
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="agenda">Agenda</MenuItem>
          </Select>

          {/* Current Date Display */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#555', 
              fontWeight: 'medium' 
            }}
          >
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" sx={{ color: '#555' }}>
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

      {/* Events list grouped by date */}
      <Box sx={{ p: 2, bgcolor: 'white' }}>
        {Object.keys(groupedEvents).map((dateKey) => (
          <Box 
            key={dateKey} 
            sx={{ 
              mb: 3,
              display: 'flex',
              width: '100%',
              gap: 2
            }}
          >
            {/* Date Circle on Left */}
            <Box
              sx={{
                minWidth: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box
                sx={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isToday(dateKey) ? theme.palette.primary.main : 'transparent',
                  border: isToday(dateKey) ? 'none' : '1px solid #e0e0e0',
                  color: isToday(dateKey) ? 'white' : 'inherit'
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {getDayNumber(dateKey)}
                </Typography>
              </Box>
            </Box>

            {/* Events Column */}
            <Box sx={{ flex: 1 }}>
              {groupedEvents[dateKey].length === 0 ? (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    No events scheduled
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.5} width="100%">
                  {groupedEvents[dateKey].map((event) => (
                    <Paper
                      key={event.id || event._id}
                      onClick={() => handleEventClick(event)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          boxShadow: 1,
                          bgcolor: '#fafafa'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        {/* Event Details on Left */}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 500,
                              color: isEventEnded(event) ? '#666' : '#333',
                              mb: 0.5,
                              mt: '2px' // Align with time text
                            }}
                          >
                            {event.title}
                          </Typography>
                          {event.description && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#666',
                                mb: 1
                              }}
                            >
                              {event.description}
                            </Typography>
                          )}
                          {event.teacherId && teachers && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: getEventColor(event),
                                  fontSize: '0.75rem'
                                }}
                              >
                                {getTeacherForEvent(event)?.name?.[0] || 'T'}
                              </Avatar>
                              <Typography variant="caption" color="textSecondary">
                                {getTeacherForEvent(event)?.name || 'Unknown Teacher'}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Time and Status on Right */}
                        <Box sx={{ 
                          minWidth: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          mt: 0.5 // Add top margin to align with title
                        }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#666',
                              display: 'block',
                              fontSize: '0.75rem',
                              mb: 1
                            }}
                          >
                            {formatTime(event.startTime)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </Typography>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: '4px',
                              display: 'inline-block',
                              bgcolor: isEventEnded(event) ? '#f5f5f5' : 
                                      isEventActive(event) ? '#e8f5e9' : '#e3f2fd',
                              color: isEventEnded(event) ? '#666' : 
                                     isEventActive(event) ? '#2e7d32' : '#1976d2',
                              fontSize: '0.75rem'
                            }}
                          >
                            {isEventEnded(event) ? 'Ended' : 
                             isEventActive(event) ? 'Active' : 'Upcoming'}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
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

      {/* Event details modal */}
      <TaskDetailsMobile 
        open={detailsOpen} 
        onClose={handleCloseDetails} 
        event={selectedEvent} 
      />
    </Box>
  );
};

export default MobileAgendaView;