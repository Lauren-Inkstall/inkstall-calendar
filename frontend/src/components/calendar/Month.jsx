import React, { useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

const Month = ({ currentDate = new Date(), events = [], onEventClick }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Get the first day of the month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get the number of days in the month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get the day of the week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfWeek = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate the days for the month view
  const generateMonthDays = () => {
    const daysInMonth = getDaysInMonth(currentDate || new Date());
    const firstDayOfWeek = getFirstDayOfWeek(currentDate || new Date());
    
    // Create array for all days in the month view (including padding days)
    const days = [];
    
    // Add padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, isPadding: true });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ 
        day: i, 
        date: dayDate,
        isPadding: false,
        isToday: isToday(dayDate)
      });
    }
    
    return days;
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!day || day.isPadding) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.date.getDate() && 
             eventDate.getMonth() === day.date.getMonth() && 
             eventDate.getFullYear() === day.date.getFullYear();
    });
  };

  const days = generateMonthDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Calendar Grid */}
      <Box sx={{ width: '100%' }}>
        {/* Week days header */}
        <Grid container spacing={0}>
          {weekDays.map((day, index) => (
            <Grid item xs={12/7} key={index}>
              <Box sx={{ textAlign: 'center', p: 1, fontWeight: 'bold' }}>
                <Typography variant="subtitle2">{day}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Calendar days */}
        <Grid container spacing={0}>
          {days.map((day, index) => (
            <Grid item xs={12/7} key={index}>
              <Paper 
                elevation={0}
                sx={{ 
                  height: '120px', 
                  p: 1, 
                  m: 0.5, 
                  border: '1px solid #e0e0e0',
                  backgroundColor: day.isPadding ? '#f5f5f5' : 'white',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: day.isPadding ? '#f5f5f5' : 'rgba(0, 0, 0, 0.04)'
                  },
                  cursor: day.isPadding ? 'default' : 'pointer'
                }}
              >
                {!day.isPadding && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: day.isToday ? 'bold' : 'normal',
                        color: day.isToday ? 'primary.main' : 'inherit',
                        textAlign: 'right'
                      }}
                    >
                      {day.day}
                    </Typography>
                    
                    {/* Display events for this day */}
                    <Box sx={{ mt: 1, overflow: 'hidden' }}>
                      {getEventsForDay(day).slice(0, 3).map((event, eventIndex) => (
                        <Box 
                          key={eventIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          sx={{
                            backgroundColor: event.color || '#4285F4',
                            color: 'white',
                            p: 0.5,
                            borderRadius: '4px',
                            mb: 0.5,
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            '&:hover': {
                              filter: 'brightness(0.9)'
                            }
                          }}
                        >
                          {event.title}
                        </Box>
                      ))}
                      
                      {getEventsForDay(day).length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{getEventsForDay(day).length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </div>
  );
};

export default Month;