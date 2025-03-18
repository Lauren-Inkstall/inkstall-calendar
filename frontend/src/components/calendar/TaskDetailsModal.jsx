import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SubjectIcon from '@mui/icons-material/Subject';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import api from '../../api';
import { SaveIcon } from 'lucide-react';

const TaskDetailsModal = ({ open, onClose, task, onUpdate, onDelete, userRole = 'teacher' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingAttendanceOnly, setEditingAttendanceOnly] = useState(false);

  // Debug the userRole
  useEffect(() => {
    console.log('TaskDetailsModal userRole:', userRole);
  }, [userRole]);

  // Determine if the user can edit or delete based on their role
  const canEdit = userRole === 'admin' || userRole === 'superadmin';
  const canDelete = userRole === 'admin' || userRole === 'superadmin';
  const isTeacher = userRole === 'teacher';

  // Function to check if user has edit permissions
  const hasEditPermission = () => {
    return userRole === 'admin' || userRole === 'superadmin';
  };

  // Handle attendance update for teacher role
  const handleAttendance = () => {
    // Set editing mode to true but only for attendance
    setIsEditing(true);
    setEditingAttendanceOnly(true);

    console.log('Teacher updating attendance for event:', task);

    // You can add specific logic here to only allow editing attendance fields
    // For now, we'll just enable the editing mode
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Convert 24-hour time to 12-hour format
  const to12Hour = (time24) => {
    if (!time24) return '';
    try {
      // If already in 12-hour format
      if (time24.includes('AM') || time24.includes('PM')) {
        return time24;
      }

      // Convert from 24-hour format
      if (time24.includes(':')) {
        const [hours24, minutes] = time24.split(':');
        const hours = parseInt(hours24);
        if (isNaN(hours)) return time24;
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
      }
      return time24;
    } catch (e) {
      return time24;
    }
  };

  // Get current time in 12-hour format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditingAttendanceOnly(false);
  };

  const handleInputChange = (name, value) => {
    setEditedTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure all student data is properly formatted
      const formattedStudents = editedTask.students
        ? editedTask.students.map((student) => {
            // Make sure we're using the structure expected by the backend model
            return {
              name: student.name,
              attendance: student.attendance || 'absent',
              arrivalTime: student.arrivalTime || null,
              departureTime: student.departureTime || null,
              // Map frontend fields to backend model fields
              startTime: student.arrivalTime || null,
              endTime: student.departureTime || null
            };
          })
        : [];

      // Create a properly formatted task object
      const updatedTask = {
        ...editedTask,
        students: formattedStudents,
        // Ensure teacher field is preserved exactly as it was
        teacher: editedTask.teacherId || editedTask.teacher
      };

      console.log('Updating task with data:', updatedTask);

      // Call the API to update the event in the database
      const response = await api.patch(
        `/create-form/${task.id || task._id}`,
        updatedTask
      );

      if (response.status === 200) {
        console.log('Event updated successfully:', response.data);
        // Show success message
        setSuccess(true);
        
        // Format the response data to match what the calendar expects
        const formattedResponse = {
          ...response.data,
          id: response.data._id || response.data.id,
          _id: response.data._id || response.data.id, // Ensure both id and _id are set
          // Preserve the teacher ID to ensure proper filtering in calendar views
          teacherId: response.data.teacher || editedTask.teacherId || editedTask.teacher,
          teacher: response.data.teacher || editedTask.teacherId || editedTask.teacher
        };
        
        console.log('Formatted response for onUpdate:', formattedResponse);
        
        // Call the onUpdate function to update the UI with the formatted response data
        onUpdate(formattedResponse);
        setIsEditing(false);
      } else {
        console.error('Failed to update event:', response.data);
        setError('Failed to update event. Please try again.');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError(error.message || 'An error occurred while updating the event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Deleting event with ID:', task.id || task._id);

      // Call the API to delete the event from the database
      const response = await api.delete(`/create-form/${task.id || task._id}`);

      if (response.status === 200) {
        console.log('Event deleted successfully');
        // Show success message
        setSuccess(true);
        // Call the onDelete function to update the UI
        onDelete(task.id || task._id);
        // Close the modal
        onClose();
      } else {
        console.error('Failed to delete event:', response.data);
        setError('Failed to delete event. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error.message || 'An error occurred while deleting the event');
    } finally {
      setLoading(false);
    }
  };

  // Handle attendance toggle for a student
  const handleAttendanceToggle = (studentName) => {
    setEditedTask((prev) => ({
      ...prev,
      students: prev.students.map((student) => {
        if (student.name === studentName) {
          const newAttendance =
            student.attendance === 'present' ? 'absent' : 'present';
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
    setEditedTask((prev) => ({
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

  // Initialize edited task when task changes
  React.useEffect(() => {
    if (task) {
      const initialTask = { ...task };
      // Convert students to objects with name, attendance, arrival time and departure time
      initialTask.students = (initialTask.students || []).map((student) => {
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
      setEditedTask(initialTask);
    }
  }, [task]);

  // If task is null or undefined, don't render the modal
  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: task.color,
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}
      >
        {isEditing ? (
          <TextField
            name="title"
            value={editedTask.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            variant="outlined"
            fullWidth
            size="small"
            sx={{
              input: { color: '#ffffff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: '#ffffff',
                },
              },
            }}
          />
        ) : (
          <Typography variant="h6" component="div">{task.title}</Typography>
        )}
        <Box>
          <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <EventIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                {isEditing ? (
                  <TextField
                    name="date"
                    type="date"
                    value={
                      editedTask.date
                        ? new Date(editedTask.date).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    size="small"
                    fullWidth
                  />
                ) : (
                  <Typography variant="body1">
                    {formatDate(task.date)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <AccessTimeIcon
                sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Time
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editedTask.startTime || ''}
                    onChange={(e) =>
                      handleInputChange('startTime', e.target.value)
                    }
                    size="small"
                    type="time"
                    fullWidth
                  />
                ) : (
                  <Typography variant="body1">
                    {to12Hour(task.startTime)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <AccessTimeIcon
                sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  End Time
                </Typography>
                {isEditing ? (
                  <TextField
                    value={editedTask.endTime || ''}
                    onChange={(e) =>
                      handleInputChange('endTime', e.target.value)
                    }
                    size="small"
                    type="time"
                    fullWidth
                  />
                ) : (
                  <Typography variant="body1">
                    {to12Hour(task.endTime)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Student Attendance Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, mt: 2 }}
            >
              <PeopleIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Student Attendance
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Toggle to mark attendance
                  </Typography>
                </Box>

                {editedTask?.students && editedTask.students.length > 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 1,
                      borderRadius: '8px',
                      bgcolor: 'background.paper',
                      '& .MuiListItem-root:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <List disablePadding>
                      {editedTask.students.map((student, index) => (
                        <React.Fragment key={student.name}>
                          <ListItem
                            sx={{
                              py: 1,
                              borderBottom:
                                index < editedTask.students.length - 1
                                  ? '1px solid rgba(0, 0, 0, 0.12)'
                                  : 'none',
                              transition: 'background-color 0.2s',
                            }}
                            secondaryAction={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  minWidth: '300px',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                {student.attendance === 'present' && (
                                  <>
                                    {student.arrivalTime && (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          bgcolor: 'success.light',
                                          color: 'success.contrastText',
                                          px: 1.5,
                                          py: 0.5,
                                          borderRadius: 1,
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        <AccessTimeIcon
                                          sx={{ fontSize: '1rem', mr: 0.5 }}
                                        />
                                        {student.arrivalTime}
                                      </Box>
                                    )}

                                    {student.departureTime ? (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          bgcolor: 'info.light',
                                          color: 'info.contrastText',
                                          px: 1.5,
                                          py: 0.5,
                                          borderRadius: 1,
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        <ExitToAppIcon
                                          sx={{ fontSize: '1rem', mr: 0.5 }}
                                        />
                                        {student.departureTime}
                                      </Box>
                                    ) : (
                                      <IconButton
                                        size="small"
                                        color="info"
                                        onClick={() =>
                                          handleStudentCheckout(student.name)
                                        }
                                        sx={{
                                          border: '1px solid',
                                          borderColor: 'info.main',
                                          p: 0.5,
                                        }}
                                        title="Check-out student"
                                      >
                                        <ExitToAppIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </>
                                )}
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={student.attendance === 'present'}
                                      onChange={() =>
                                        handleAttendanceToggle(student.name)
                                      }
                                      color="success"
                                      sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                          color: 'success.main',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                                          {
                                            backgroundColor: 'success.main',
                                          },
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 'bold',
                                        color:
                                          student.attendance === 'present'
                                            ? 'success.main'
                                            : 'error.main',
                                        minWidth: '20px',
                                        transition: 'color 0.2s',
                                      }}
                                    >
                                      {student.attendance === 'present'
                                        ? 'P'
                                        : 'A'}
                                    </Typography>
                                  }
                                  labelPlacement="start"
                                />
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={student.name}
                              primaryTypographyProps={{
                                variant: 'body1',
                                fontWeight: 500,
                              }}
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    No students assigned to this event.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {task.location && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <LocationOnIcon
                  sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }}
                />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  {isEditing ? (
                    <TextField
                      name="location"
                      value={editedTask.location}
                      onChange={(e) =>
                        handleInputChange('location', e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{task.location}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          )}

          {task.teacher && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <PersonIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Teacher
                  </Typography>
                  {isEditing ? (
                    <TextField
                      name="teacher"
                      value={editedTask.teacher}
                      onChange={(e) =>
                        handleInputChange('teacher', e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{task.teacher}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 2 }}>
              <SubjectIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                {isEditing ? (
                  <TextField
                    name="description"
                    value={editedTask.description || ''}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    multiline
                    rows={3}
                    size="small"
                    fullWidth
                  />
                ) : (
                  <Typography variant="body1">
                    {task.description || 'No description provided'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        {isEditing ? (
          <>
            <Button onClick={() => setIsEditing(false)} color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : (editingAttendanceOnly ? 'Update Attendance' : 'Save Changes')}
            </Button>
          </>
        ) : (
          <>
            {!isTeacher ? (
              <>
                <Button
                  onClick={handleDelete}
                  color="error"
                  startIcon={loading ? <CircularProgress size={20} color="error" /> : <DeleteIcon />}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={handleEditToggle}
                  color="primary"
                  variant="contained"
                  startIcon={<EditIcon />}
                  disabled={loading}
                >
                  Edit
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAttendance}
                color="primary"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                Update Attendance
              </Button>
            )}
          </>
        )}
      </DialogActions>

      {/* Error and success messages */}
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {isEditing ? 'Event updated successfully!' : 'Event deleted successfully!'}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default TaskDetailsModal;