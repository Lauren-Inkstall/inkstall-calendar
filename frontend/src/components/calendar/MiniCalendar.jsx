import React, { useState } from 'react';
import { Paper } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const MiniCalendar = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleDateChange = (newDate) => {
    console.log('Selected date: ', newDate)
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 2,
        '& .react-calendar': {
          border: '1px solid #e0e0e0',
          width: '100%',
          backgroundColor: 'transparent',
          fontFamily: 'inherit'
        },
        '& .react-calendar__navigation': {
          height: '36px',
          marginBottom: '4px'
        },
        '& .react-calendar__navigation button': {
          minWidth: '32px',
          backgroundColor: 'transparent'
        },
        '& .react-calendar__month-view__weekdays': {
          textAlign: 'center',
          textTransform: 'uppercase',
          fontSize: '0.50rem',
          fontWeight: 'bold'
        },
        '& .react-calendar__month-view__days__day': {
          height: '32px',
          padding: '4px',
          fontSize: '0.85rem'
        },
        '& .react-calendar__tile--active': {
          backgroundColor: '#1a73e8',
          color: 'white',
          borderRadius: '50%'
        },
        '& .react-calendar__tile--now': {
          backgroundColor: '#e6f4ea',
          borderRadius: '50%'
        },
        '& .react-calendar__tile:hover': {
          backgroundColor: '#f1f3f4',
          borderRadius: '50%'
        },
        '& .react-calendar__tile': {
          margin: '0',
          padding: '0',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        '& .react-calendar__tile abbr': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px'
        }
      }}
    >
  <Paper elevation={0} sx={{ mb: 2 }}>
    <Calendar 
      value={currentDate}
      onChange={handleDateChange}
      showNeighboringMonth={false}
      minDetail="month"
      maxDetail="month"
      navigationLabel={({ date }) => 
        date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
      formatDay={(locale, date) => {
        const dayIndex = date.getDay();
        return (
          <span style={{ color: dayIndex === 0 ? 'red' : dayIndex === 6 ? 'black' : 'inherit' }}>
            {date.getDate()}
          </span>
        );
      }}
    />
  </Paper>
    </Paper>
  );
};

export default MiniCalendar;