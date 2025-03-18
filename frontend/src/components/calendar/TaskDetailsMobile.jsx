import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SubjectIcon from '@mui/icons-material/Subject';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const TaskDetailsMobile = ({ open, onClose, event }) => {
  console.log('TaskDetailsMobile rendered with props:', { open, event });
  
  const [editedEvent, setEditedEvent] = useState(null);

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle attendance toggle
  const handleAttendanceToggle = (studentName) => {
    setEditedEvent((prev) => ({
      ...prev,
      students: prev.students.map((student) => {
        if (student.name === studentName) {
          const newAttendance = student.attendance === 'present' ? 'absent' : 'present';
          return {
            ...student,
            attendance: newAttendance,
            arrivalTime: newAttendance === 'present' ? getCurrentTime() : null,
            departureTime: null, // Reset departure time when attendance changes
          };
        }
        return student;
      }),
    }));
  };

  // Handle student checkout (record departure time)
  const handleStudentCheckout = (studentName) => {
    setEditedEvent((prev) => ({
      ...prev,
      students: prev.students.map((student) => {
        if (student.name === studentName && student.attendance === 'present') {
          return {
            ...student,
            departureTime: getCurrentTime(),
          };
        }
        return student;
      }),
    }));
  };

  // Initialize edited event when event changes
  useEffect(() => {
    if (event) {
      const initialEvent = { ...event };
      // Convert students to objects with name, attendance, arrival time and departure time
      initialEvent.students = (initialEvent.students || []).map((student) => {
        if (typeof student === 'object' && student.name) {
          return {
            name: student.name,
            attendance: student.attendance || 'absent',
            arrivalTime: student.arrivalTime || null,
            departureTime: student.departureTime || null,
          };
        }
        return {
          name: student,
          attendance: 'absent',
          arrivalTime: null,
          departureTime: null,
        };
      });
      setEditedEvent(initialEvent);
    }
  }, [event]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const to12Hour = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Guard clause for when event is null
  if (!event && open) {
    console.log('Event is null but modal is open');
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        PaperProps={{
          sx: {
            maxWidth: '375px',
            margin: 'auto',
            borderRadius: '8px',
          },
        }}
      >
        <DialogTitle>
          <Typography>Loading...</Typography>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Event details are loading...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!open || !editedEvent) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          maxWidth: '375px', // iPhone SE width
          margin: 'auto',
          borderRadius: '8px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: editedEvent?.color || '#1a73e8',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
          {editedEvent?.title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#ffffff', ml: 1, flexShrink: 0 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <List disablePadding>
          {/* Date */}
          <ListItem sx={{ px: 0 }}>
            <EventIcon sx={{ mr: 2, color: '#1a73e8' }} />
            <ListItemText 
              primary="Date" 
              secondary={formatDate(editedEvent?.date)}
              primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
            />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          {/* Time */}
          <ListItem sx={{ px: 0 }}>
            <AccessTimeIcon sx={{ mr: 2, color: '#1a73e8' }} />
            <ListItemText 
              primary="Time" 
              secondary={`${to12Hour(editedEvent?.startTime)} - ${to12Hour(editedEvent?.endTime)}`}
              primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
            />
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          {/* Location */}
          {editedEvent?.location && (
            <>
              <ListItem sx={{ px: 0 }}>
                <LocationOnIcon sx={{ mr: 2, color: '#1a73e8' }} />
                <ListItemText 
                  primary="Location" 
                  secondary={editedEvent.location}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
            </>
          )}
          
          {/* Teacher */}
          {editedEvent?.teacher && (
            <>
              <ListItem sx={{ px: 0 }}>
                <PersonIcon sx={{ mr: 2, color: '#1a73e8' }} />
                <ListItemText 
                  primary="Teacher" 
                  secondary={typeof editedEvent.teacher === 'object' ? editedEvent.teacher.name : editedEvent.teacher}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
            </>
          )}
          
          {/* Description */}
          {editedEvent?.description && (
            <>
              <ListItem sx={{ px: 0 }}>
                <SubjectIcon sx={{ mr: 2, color: '#1a73e8' }} />
                <ListItemText 
                  primary="Description" 
                  secondary={editedEvent.description}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ 
                    variant: 'body1', 
                    color: 'text.primary',
                    sx: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                  }}
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {/* Students */}
          {editedEvent?.students && editedEvent.students.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 1, color: '#1a73e8' }} />
                Students
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1 }}>
                <List disablePadding>
                  {editedEvent.students.map((student, index) => (
                    <React.Fragment key={student.name}>
                      <ListItem sx={{ px: 2 }}>
                        <ListItemText
                          primary={student.name}
                          secondary={
                            student.attendance === 'present' 
                              ? `Present (Arrived: ${student.arrivalTime || 'N/A'}${student.departureTime ? `, Left: ${student.departureTime}` : ''})`
                              : 'Absent'
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormControlLabel
                            sx={{ mr: 0 }}
                            control={
                              <Switch
                                checked={student.attendance === 'present'}
                                onChange={() => handleAttendanceToggle(student.name)}
                                color="primary"
                              />
                            }
                            label=""
                          />
                          {student.attendance === 'present' && !student.departureTime && (
                            <IconButton
                              size="small"
                              onClick={() => handleStudentCheckout(student.name)}
                              sx={{ ml: 1 }}
                            >
                              <ExitToAppIcon />
                            </IconButton>
                          )}
                        </Box>
                      </ListItem>
                      {index < editedEvent.students.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsMobile;