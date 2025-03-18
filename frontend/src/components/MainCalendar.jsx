import React, { useEffect, useState, useContext } from 'react';
import { Box, useMediaQuery, Button, Typography } from '@mui/material';
import CalanderLeft from './calendar/CalanderLeft';
import CalanderRight from './calendar/CalanderRight';
import { InfoContext } from '../context/InfoContext';
import api from '../api';

const defaultColors = [
  '#4285F4', '#EA4335', '#34A853', '#FBBC05', '#8E24AA',
  '#FF9800', '#009688', '#E91E63', '#3F51B5', '#795548',
  '#607D8B', '#9C27B0', '#00BCD4', '#FFC107', '#FF5722',
  '#673AB7', '#2196F3', '#F44336', '#4CAF50', '#CDDC39',
  '#FF4081'
];

const MainCalendar = () => {
  const { teachers: contextTeachers } = useContext(InfoContext);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teachers, setTeachers] = useState([]);
  const [viewMode, setViewMode] = useState('Day'); 
  const [userRole, setUserRole] = useState(''); 
  const [currentUserId, setCurrentUserId] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get the user role from localStorage or context
  useEffect(() => {
    try {
      // Try to get the role from localStorage
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        setUserRole(storedRole);
      } else {
        // If not in localStorage, check if there's a user object with role
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.role) {
            setUserRole(user.role);
            // Store the user ID if available
            if (user._id) {
              setCurrentUserId(user._id);
            }
          } else {
            // Default to teacher if no role found
            setUserRole('teacher');
          }
        } else {
          // Default to teacher if no user found
          setUserRole('teacher');
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      // Default to teacher if there's an error
      setUserRole('teacher');
    }
  }, []);

  const isMobile = useMediaQuery('(max-width:768px)');
  const isIPhoneSE = useMediaQuery('(max-width:375px)'); 
  
  // Fetch events from the database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/create-form');

        if (response.status === 200 && response.data) {
          
          // Format events for the calendar
          const formattedEvents = response.data.map(event => {
            // Create a base formatted event
            const formattedEvent = {
              ...event,
              id: event._id || event.id,
              _id: event._id || event.id, // Ensure both id and _id are set
              teacherId: event.teacher, // Store original teacher value as teacherId
              teacher: event.teacher, // Keep original teacher value
              color: event.color || '#4285F4',
              eventType: 'calendar',
              isNotification: false
            };
            
            // Try to find teacher name if teachers are loaded
            if (teachers.length > 0) {
              const teacherObj = teachers.find(t => t.id === event.teacher);
              if (teacherObj) {
                // Only update the display name, keep the ID for matching
                formattedEvent.teacherName = teacherObj.name;
              }
            }
            
            // Ensure date is properly formatted
            if (event.date) {
              try {
                // If date is already a Date object, use it directly
                if (event.date instanceof Date) {
                  formattedEvent.date = event.date;
                } else {
                  // Otherwise, create a new Date object
                  const parsedDate = new Date(event.date);
                  
                  // Check if the date is valid
                  if (isNaN(parsedDate.getTime())) {
                    console.error(`Invalid date for event ${formattedEvent.id}:`, event.date);
                    // Use current date as fallback
                    formattedEvent.date = new Date();
                  } else {
                    formattedEvent.date = parsedDate;
                  }
                }
                
              } catch (error) {
                console.error(`Error formatting date for event ${formattedEvent.id}:`, error);
                // Use current date as fallback
                formattedEvent.date = new Date();
              }
            } else {
              console.warn(`Event ${formattedEvent.id} has no date, using current date as fallback`);
              formattedEvent.date = new Date();
            }
            
            // Ensure startTime is properly formatted (HH:MM)
            if (event.startTime) {
              if (!event.startTime.includes(':')) {
                // If it's just a number, assume it's hours and add :00 for minutes
                formattedEvent.startTime = `${event.startTime}:00`;
              }
              
              // Ensure it's a 24-hour format with leading zeros
              try {
                const [hours, minutes] = formattedEvent.startTime.split(':');
                const parsedHours = parseInt(hours, 10);
                const parsedMinutes = parseInt(minutes || '0', 10);
                
                if (!isNaN(parsedHours) && !isNaN(parsedMinutes)) {
                  // Format with leading zeros
                  formattedEvent.startTime = `${parsedHours.toString().padStart(2, '0')}:${parsedMinutes.toString().padStart(2, '0')}`;
                }
              } catch (error) {
                console.error(`Error formatting startTime for event ${formattedEvent.id}:`, error);
              }
            }
            
            // Do the same for endTime if it exists
            if (event.endTime) {
              if (!event.endTime.includes(':')) {
                formattedEvent.endTime = `${event.endTime}:00`;
              }
              
              try {
                const [hours, minutes] = formattedEvent.endTime.split(':');
                const parsedHours = parseInt(hours, 10);
                const parsedMinutes = parseInt(minutes || '0', 10);
                
                if (!isNaN(parsedHours) && !isNaN(parsedMinutes)) {
                  formattedEvent.endTime = `${parsedHours.toString().padStart(2, '0')}:${parsedMinutes.toString().padStart(2, '0')}`;
                }
              } catch (error) {
                console.error(`Error formatting endTime for event ${formattedEvent.id}:`, error);
              }
            }
            
            return formattedEvent;
          });
                    
          // Check for 2PM events specifically
          const twopmEvents = formattedEvents.filter(event => 
            event.startTime && event.startTime.startsWith('14:')
          );
          
          // Replace all events instead of trying to merge
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch events regardless of teachers array status
    fetchEvents();
    
  }, [teachers, refreshTrigger]);

  useEffect(() => {
    if (contextTeachers) {
      const formattedTeachers = contextTeachers.map((teacher, index) => ({
        id: teacher._id,
        name: teacher.teacherName,
        checked: true,
        color: defaultColors[index % defaultColors.length]
      }));
      setTeachers(formattedTeachers);
    }
  }, [contextTeachers]);

  useEffect(() => {
    if (isIPhoneSE) {
      setViewMode('Day');
    }
  }, [isIPhoneSE]);

  const handleViewChange = (mode) => {
    if (isIPhoneSE) {
      return; 
    }
    setViewMode(mode);
  };

  const handleAddEvent = (newEvent) => {
    
    const eventWithColor = {
      ...newEvent,
      id: newEvent._id || newEvent.id || Date.now(),
      color: newEvent.color,
      teacherId: newEvent.teacherId || newEvent.teacher, // Ensure teacherId is set
    };

    setEvents((prevEvents) => [...prevEvents, eventWithColor]);
    
    // Trigger a refresh to fetch the latest data from the server
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdateEvent = (updatedEvent) => {
    try {
      
      // Ensure the updated event has all required fields
      const formattedEvent = {
        ...updatedEvent,
        id: updatedEvent._id || updatedEvent.id,
        _id: updatedEvent._id || updatedEvent.id,
        // Preserve the teacher ID to ensure proper filtering in calendar views
        teacherId: updatedEvent.teacherId || updatedEvent.teacher,
        teacher: updatedEvent.teacher || updatedEvent.teacherId,
        color: updatedEvent.color || '#4285F4',
        eventType: 'calendar',
        isNotification: false
      };
      
      // Try to find teacher name if it's an ID
      if (teachers.length > 0) {
        const teacherObj = teachers.find(t => 
          t.id === formattedEvent.teacherId || 
          t.id === formattedEvent.teacher
        );
        if (teacherObj) {
          // Add the teacher name but keep the ID for matching
          formattedEvent.teacherName = teacherObj.name;
        }
      }
      
      // Find the event index by id
      const eventIndex = events.findIndex(
        (e) => e.id === formattedEvent.id || e._id === formattedEvent._id
      );
      
      if (eventIndex !== -1) {
        // Create a new array with the updated event
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = formattedEvent;

        setEvents(updatedEvents);
      } else {
        // If event wasn't found, add it to the events array
        setEvents([...events, formattedEvent]);
      }
      
      // Trigger a refresh to ensure all components update
      setRefreshTrigger(Date.now());
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = (eventId) => {
    
    setEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== eventId),
    );
    
    // Trigger a refresh to fetch the latest data from the server
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleToggleTeacher = (id) => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((teacher) =>
        teacher.id === id ? { ...teacher, checked: !teacher.checked } : teacher,
      ),
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
        }}
      >
        {!isIPhoneSE && (
          <Box 
            sx={{ 
              width: isMobile ? '100%' : '240px',
              borderRight: '1px solid #e0e0e0',
            }}
          >
            <CalanderLeft
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onAddEvent={handleAddEvent}
              viewMode={viewMode}
              onViewChange={handleViewChange}
              teachers={teachers}
              onToggleTeacher={handleToggleTeacher}
              userRole={userRole}
              currentUserId={currentUserId}
              isMobile={isMobile}
            />
          </Box>
        )}
        <Box 
          sx={{ 
            flex: 1,
            height: '100%',
            overflow: 'auto',
          }}
        >
          <CalanderRight
            events={events}
            selectedDate={selectedDate}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            viewMode={viewMode}
            onViewChange={handleViewChange}
            teachers={teachers}
            userRole={userRole}
            isIPhoneSE={isIPhoneSE}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MainCalendar;