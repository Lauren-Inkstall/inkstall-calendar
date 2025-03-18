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
  IconButton,
  InputAdornment,
  TextField,
  Collapse
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import TaskDetailsMobile from './TaskDetailsMobile';
import PropTypes from 'prop-types';

const MobileAgendaView = ({
  events = [],
  selectedDate,
  onEventClick,
  onAddEvent,
  teachers,
  userRole = 'admin',
  currentTeacherId,
  currentUserName,
  currentUserEmail,
  getEventColor: externalGetEventColor
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupedEvents, setGroupedEvents] = useState({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewType, setViewType] = useState('agenda');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState({});
  const theme = useTheme();
  
  // Get user email from localStorage
  const [userEmail, setUserEmail] = useState('');
  
  // Get user email from localStorage on component mount
  useEffect(() => {
    if (userRole === 'teacher') {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setUserEmail(storedEmail);
      } else {
        console.warn('MobileAgendaView - No user email found in localStorage for teacher');
      }
    }
  }, [userRole]);

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
    
    // Filter events based on checked teachers
    let filteredEvents = [...events]; // Create a copy to avoid modifying the original
    
    // Get checked teachers
    const checkedTeachers = teachers ? teachers.filter(teacher => teacher.checked) : [];

    // Filter events to only include those from checked teachers
    if (checkedTeachers.length > 0) {
      filteredEvents = events.filter(event => {
        // Check if the event belongs to any of the checked teachers
        return checkedTeachers.some(teacher => {
          // Match by teacher ID (most reliable)
          if (event.teacherId && teacher.id === event.teacherId) {
            return true;
          }
          
          // Match by teacher object ID
          if (typeof event.teacher === 'object' && event.teacher?.id === teacher.id) {
            return true;
          }
          
          // Match by teacher email
          if (event.teacherEmail && teacher.email && 
              event.teacherEmail.toLowerCase() === teacher.email.toLowerCase()) {
            return true;
          }
          
          // Match by teacher name
          if (typeof event.teacher === 'string' && 
              event.teacher.toLowerCase() === teacher.name.toLowerCase()) {
            return true;
          }
          
          return false;
        });
      });
    }
    
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
          
          // Compare hours first
          if (aTime[0] !== bTime[0]) {
            return aTime[0] - bTime[0];
          }
          
          // If hours are the same, compare minutes
          return aTime[1] - bTime[1];
        });
      }
    });
    
    setGroupedEvents(grouped);
    
    // Also update filtered events for search functionality
    setFilteredEvents(grouped);
  }, [events, currentDate, userRole, userEmail, currentTeacherId, currentUserName, teachers]);

  // Filter events based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(groupedEvents);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = {};

    // Loop through each date in grouped events
    Object.keys(groupedEvents).forEach(dateKey => {
      // Filter events for this date
      const matchingEvents = groupedEvents[dateKey].filter(event => {
        // Check event title
        if (event.title && event.title.toLowerCase().includes(query)) {
          return true;
        }
        
        // Check teacher name
        if (event.teacher) {
          const teacherName = typeof event.teacher === 'object' 
            ? (event.teacher.name || '') 
            : event.teacher;
          
          if (teacherName.toLowerCase().includes(query)) {
            return true;
          }
        }
        
        // Check description
        if (event.description && event.description.toLowerCase().includes(query)) {
          return true;
        }
        
        // Check students
        if (event.students && event.students.length > 0) {
          return event.students.some(student => {
            const studentName = typeof student === 'object' 
              ? (student.name || '') 
              : student;
            
            return studentName.toLowerCase().includes(query);
          });
        }
        
        return false;
      });
      
      // Only add dates with matching events
      if (matchingEvents.length > 0) {
        filtered[dateKey] = matchingEvents;
      }
    });
    
    setFilteredEvents(filtered);
  }, [searchQuery, groupedEvents]);

  // Scroll to current date events when component mounts or date changes
  useEffect(() => {
    // Function to scroll to current date's events
    const scrollToCurrentDate = () => {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const currentDateElement = document.getElementById(`date-${currentDateStr}`);
      
      if (currentDateElement) {
        // Use scrollIntoView with behavior: 'smooth' for a smooth scrolling effect
        // and block: 'center' to center the element vertically
        currentDateElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(scrollToCurrentDate, 100);
    
    // Clean up timeout
    return () => clearTimeout(timeoutId);
  }, [currentDate, filteredEvents]);

  // Toggle search box
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery(''); // Clear search when closing
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

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
      {/* Header with search and avatar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f5f5f5'
      }}>
        {/* Search button on left */}
        <IconButton size="small" sx={{ color: '#555' }} onClick={toggleSearch}>
          <SearchIcon />
        </IconButton>
        
        {/* Date with navigation in center */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1
        }}>
          <IconButton 
            size="small" 
            onClick={() => {
              const prevDate = new Date(currentDate);
              prevDate.setDate(currentDate.getDate() - 1);
              setCurrentDate(prevDate);
            }}
            sx={{ color: '#555' }}
          >
            <NavigateBeforeIcon />
          </IconButton>
          
          <Box 
            onClick={toggleCalendar}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#555', 
                fontWeight: 'medium',
                textAlign: 'center',
                minWidth: '150px'
              }}
            >
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
            <KeyboardArrowDownIcon fontSize="small" sx={{ color: '#555', ml: 0.5 }} />
          </Box>
          
          <IconButton 
            size="small" 
            onClick={() => {
              const nextDate = new Date(currentDate);
              nextDate.setDate(currentDate.getDate() + 1);
              setCurrentDate(nextDate);
            }}
            sx={{ color: '#555' }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
        
        {/* Avatar on right */}
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

      {/* Search Box */}
      <Collapse in={searchOpen}>
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search events, teachers, or students..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={clearSearch}
                    aria-label="clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { 
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0'
                }
              }
            }}
          />
          {Object.keys(filteredEvents).length === 0 && searchQuery && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
              No matching events found
            </Typography>
          )}
        </Box>
      </Collapse>

      {/* Events list grouped by date */}
      <Box sx={{ p: 2, bgcolor: 'white' }}>
        {Object.keys(filteredEvents).length > 0 ? (
          <Stack spacing={1.5}>
            {Object.keys(filteredEvents).sort().map(dateKey => 
              filteredEvents[dateKey].map((event, index) => (
                <Paper
                  key={`${dateKey}-${event.id || event._id || index}`}
                  id={index === 0 ? `date-${dateKey}` : undefined} // Add ID for scrolling to first event of date
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
                    {/* Date Circle */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      mt: 0.5
                    }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: isToday(event.date) ? theme.palette.primary.main : '#f0f0f0',
                        color: isToday(event.date) ? 'white' : '#333',
                        fontWeight: 'medium',
                        fontSize: '1.1rem',
                        mb: 0.5
                      }}>
                        {new Date(event.date).getDate()}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                    </Box>
                    
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
              ))
            )}
          </Stack>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: 200,
            color: 'text.secondary'
          }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {searchQuery ? 'No matching events found' : 'No events scheduled'}
            </Typography>
            {!searchQuery && (
              <Typography variant="body2">
                Select a different date or add new events
              </Typography>
            )}
          </Box>
        )}
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

// Add PropTypes for type checking
MobileAgendaView.propTypes = {
  events: PropTypes.array,
  selectedDate: PropTypes.instanceOf(Date),
  onEventClick: PropTypes.func,
  onAddEvent: PropTypes.func,
  teachers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      checked: PropTypes.bool,
      color: PropTypes.string
    })
  ),
  userRole: PropTypes.string,
  currentTeacherId: PropTypes.string,
  currentUserName: PropTypes.string,
  currentUserEmail: PropTypes.string,
  getEventColor: PropTypes.func
};

export default MobileAgendaView;