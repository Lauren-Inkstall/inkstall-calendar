//updated
import React, { useState } from 'react'
import { Card, CardContent, Typography, Box, Button, List, ListItem, Chip, Divider, Avatar } from '@mui/material'
import TeacherImage from '../assets/Images/pfp.jpeg'
import { CalendarCheck2, Clock9, Eye, IndianRupee, Mail, Pencil } from 'lucide-react';
// import SalaryCalculator from './SalaryCalculator';

const TeacherCard = ({ teacher }) => {
    const {name, emailId, joining_date, salary, timing, subjects, _id} = teacher;

    const [hover, setHover] = useState(false);
    const [salaryCalculatorOpen, setSalaryCalculatorOpen] = useState(false);

    const handleOpenSalaryCalculator = () => {
        setSalaryCalculatorOpen(true);
    };

    const handleCloseSalaryCalculator = () => {
        setSalaryCalculatorOpen(false);
    };

    const details = [
      {text: 'Joined '+joining_date, icon: <CalendarCheck2 size={16} color="#5c6bc0" />},
      {text: salary, icon: <IndianRupee size={16} color="#5c6bc0" />},
      {text: timing, icon: <Clock9 size={16} color="#5c6bc0" />}
    ]

    return (
        <>
            <Card sx={{
                height: 'auto',
                width: '32%',
                display: 'flex',
                flexDirection: 'column',
                p: 0,
                overflow: 'hidden',
                borderRadius: '12px',
                boxShadow: hover 
                  ? '0px 8px 24px rgba(0,0,0,0.15)' 
                  : '0px 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                transform: hover ? 'translateY(-5px)' : 'none',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              {/* Teacher Card Header */}
              <Box sx={{ 
                position: 'relative',
                height: '80px',
                background: 'linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                px: 2.5,
                pb: 5,
              }}>
                <Avatar
                  src={TeacherImage}
                  alt={`${name}'s profile`}
                  sx={{
                    position: 'absolute',
                    bottom: '-30px',
                    width: 70,
                    height: 70,
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
              
              {/* Card Content */}
              <Box sx={{ pt: 5, px: 2.5, pb: 2 }}>
                {/* Name and Actions Row */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Typography sx={{
                    fontWeight: 600, 
                    fontSize: '18px', 
                    color: '#1a237e'
                  }}>
                    {name || 'Teacher Name'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1
                  }}>
                    {/* Rupee Icon - New */}
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      p: 0.8,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(77,86,175,0.1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(77,86,175,0.2)',
                      }
                    }}
                    onClick={handleOpenSalaryCalculator}
                    >
                      <IndianRupee size={18} color="#3f51b5" />
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      p: 0.8,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(77,86,175,0.1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(77,86,175,0.2)',
                      }
                    }}>
                      <Eye size={18} color="#3f51b5" />
                    </Box>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      p: 0.8,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(77,86,175,0.1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(77,86,175,0.2)',
                      }
                    }}>
                      <Pencil size={18} color="#3f51b5" />
                    </Box>
                  </Box>
                </Box>
                
                {/* Teacher Details */}
                <List sx={{ p: 0, mb: 2 }}>
                  <ListItem sx={{
                    fontSize: '14px',
                    padding: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    '& svg': {
                      flexShrink: 0
                    }
                  }}>
                    <Mail size={16} color="#5c6bc0" />
                    <Typography sx={{ 
                      color: '#424242', 
                      fontSize: '14px',
                      fontWeight: 400
                    }}>
                      {emailId || 'Email not available'}
                    </Typography>
                  </ListItem>
                  
                  {details.map((detail, index) => (
                    <ListItem key={index} sx={{
                      fontSize: '14px',
                      padding: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '& svg': {
                        flexShrink: 0
                      }
                    }}>
                      {detail.icon} 
                      <Typography sx={{ 
                        color: '#424242', 
                        fontSize: '14px',
                        fontWeight: 400
                      }}>
                        {detail.text}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                
                {/* Divider */}
                <Divider sx={{ mb: 1.5 }} />
                
                {/* Subject Tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {subjects.map((subject, index) => (
                    <Chip
                      key={index}
                      label={subject}
                      size="small"
                      sx={{
                        backgroundColor: hover ? 'rgba(63, 81, 181, 0.15)' : 'rgba(63, 81, 181, 0.08)',
                        color: '#3f51b5',
                        fontWeight: 500,
                        fontSize: '12px',
                        borderRadius: '16px',
                        transition: 'all 0.2s',
                        border: '1px solid rgba(63, 81, 181, 0.15)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Card>
            
            {/* Salary Calculator Dialog */}
            {/* <SalaryCalculator 
                open={salaryCalculatorOpen}
                handleClose={handleCloseSalaryCalculator}
                teacherName={name}
                teacherId={_id}
                baseSalary={salary}
            /> */}
        </>
    )
}

export default TeacherCard