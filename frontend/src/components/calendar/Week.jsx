import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NewEventForm from './NewEventForm';

const Week = ({ currentDate, events = [], onAddEvent, onEventClick }) => {
  const [open, setOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Get the start of the week (Sunday) for the current date
  const getStartOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    return startOfWeek;
  };

  // Get array of days for the current week
  const getDaysOfWeek = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Format date for display
  const formatDate = (date) => {
    return date.getDate();
  };

  // Format day name
  const formatDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleOpenEventForm = (hour, day) => {
    setSelectedTimeSlot(hour);
    setSelectedDay(day);
    setOpen(true);
  };

  const handleCloseEventForm = () => {
    setOpen(false);
    setSelectedTimeSlot(null);
    setSelectedDay(null);
  };

  const addEvent = (eventDetails) => {
    events.push(eventDetails);
    handleCloseEventForm();
    if (onAddEvent) {
      onAddEvent(eventDetails);
    }
  };

  // Generate time slots from 8 AM to 8 PM
  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const displayHour = hour <= 12 ? hour : hour - 12;
      const amPm = hour < 12 ? 'AM' : 'PM';
      const timeLabel = `${displayHour} ${amPm}`;
      
      timeSlots.push({
        hour,
        label: timeLabel
      });
    }
    return timeSlots;
  };

  // Get events for a specific day and hour
  const getEventsForTimeSlot = (day, hour) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const dayDate = new Date(day);
      
      return eventDate.getDate() === dayDate.getDate() && 
             eventDate.getMonth() === dayDate.getMonth() && 
             eventDate.getFullYear() === dayDate.getFullYear() && 
             event.hour === hour;
    });
  };

  const days = getDaysOfWeek();
  const timeSlots = generateTimeSlots();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Week Header - now with sticky positioning */}
      <Box sx={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Time column header */}
        <Box sx={{ width: '60px', flexShrink: 0 }}></Box>
        
        {/* Day columns headers */}
        {days.map((day, index) => (
          <Box 
            key={index} 
            sx={{ 
              flex: 1, 
              textAlign: 'center', 
              py: 1,
              borderLeft: index > 0 ? '1px solid #e0e0e0' : 'none'
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: isToday(day) ? 'bold' : 'normal',
                color: isToday(day) ? 'primary.main' : 'inherit'
              }}
            >
              {formatDayName(day)}
            </Typography>
            <Box
              sx={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                backgroundColor: isToday(day) ? 'primary.main' : 'transparent',
                color: isToday(day) ? 'white' : 'inherit'
              }}
            >
              <Typography variant="body2">
                {formatDate(day)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Time Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
        {timeSlots.map((timeSlot, timeIndex) => (
          <Box 
            key={timeIndex} 
            sx={{ 
              display: 'flex', 
              borderBottom: '1px solid #e0e0e0',
              minHeight: '60px'
            }}
          >
            {/* Time Label */}
            <Box 
              sx={{ 
                width: '60px', 
                p: 1, 
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {timeSlot.label}
              </Typography>
            </Box>
            
            {/* Day Columns */}
            {days.map((day, dayIndex) => (
              <Box 
                key={dayIndex} 
                sx={{ 
                  flex: 1, 
                  position: 'relative',
                  borderLeft: dayIndex > 0 ? '1px solid #e0e0e0' : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  },
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenEventForm(timeSlot.hour, day)}
              >
                {/* Events for this time slot */}
                {getEventsForTimeSlot(day, timeSlot.hour).map((event, eventIndex) => (
                  <Paper
                    key={eventIndex}
                    elevation={1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    sx={{
                      backgroundColor: event.color || '#4285F4',
                      color: 'white',
                      p: 1,
                      m: 0.5,
                      cursor: 'pointer',
                      '&:hover': {
                        filter: 'brightness(0.9)'
                      }
                    }}
                  >
                    <Typography variant="caption" noWrap>
                      {event.title}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* New Event Form Dialog */}
      {open && (
        <NewEventForm 
          open={open}
          onClose={handleCloseEventForm}
          onSubmit={addEvent}
          initialDate={selectedDay ? selectedDay.toISOString().split('T')[0] : null}
          initialTime={selectedTimeSlot ? `${selectedTimeSlot}:00` : null}
        />
      )}
    </Box>
  );
};

export default Week;