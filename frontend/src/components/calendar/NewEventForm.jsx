import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
  Chip,
  Checkbox,
  InputAdornment,
  FormHelperText,
  CircularProgress,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SubjectIcon from '@mui/icons-material/Subject';
import GroupIcon from '@mui/icons-material/Group';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CircleIcon from '@mui/icons-material/Circle';
import SearchIcon from '@mui/icons-material/Search';
import { InfoContext } from '../../context/InfoContext';
import { StudentsContext } from '../../context/StudentContext';
import { SubjectsContext } from '../../context/SubjectsContext';
import api from '../../api';

const colorOptions = [
  { name: 'Blue', value: '#4285F4' },
  { name: 'Red', value: '#EA4335' },
  { name: 'Green', value: '#34A853' },
  { name: 'Yellow', value: '#FBBC05' },
  { name: 'Purple', value: '#8E24AA' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Teal', value: '#009688' },
  { name: 'Pink', value: '#E91E63' },
];

const generateTimeOptions = () => {
  const options = [];

  for (let hour = 12; hour < 24; hour++) {
    const displayHour = hour === 12 ? 12 : hour - 12;

    options.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${displayHour}:00 PM`,
    });

    options.push({
      value: `${hour.toString().padStart(2, '0')}:30`,
      label: `${displayHour}:30 PM`,
    });
  }

  for (let hour = 0; hour < 12; hour++) {
    const displayHour = hour === 0 ? 12 : hour;

    options.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${displayHour}:00 AM`,
    });

    options.push({
      value: `${hour.toString().padStart(2, '0')}:30`,
      label: `${displayHour}:30 AM`,
    });
  }

  return options;
};

const timeOptions = generateTimeOptions();

const NewEventForm = ({
  open,
  onClose,
  onSubmit,
  initialDate = null,
  initialTime = '',
  teachers = [],
  initialTeacherId = null,
}) => {
  const { branches } = useContext(InfoContext);
  const { students, loading: studentsLoading } = useContext(StudentsContext);
  const { subjects, loading: subjectsLoading } = useContext(SubjectsContext);

  const loading = studentsLoading || subjectsLoading;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  const today = new Date();
  const formattedDate =
    initialDate ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(today.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: formattedDate,
    startTime: initialTime,
    duration: '1 hour',
    endTime: '',
    displayEndTime: '',
    teacher: '',
    teacherId: null,
    teacherEmail: '', // Store the teacher's email
    subject: '',
    branch: '',
    students: [],
    location: '',
    color: '#4285F4',
  });

  const [errors, setErrors] = useState({});
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [studentAnchorEl, setStudentAnchorEl] = useState(null);
  const [teacherAnchorEl, setTeacherAnchorEl] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: initialDate || formattedDate,
      startTime: initialTime || '',
    }));
  }, [initialDate, formattedDate, initialTime]);

  useEffect(() => {
    if (initialTeacherId && teachers && teachers.length > 0) {
      const selectedTeacher = teachers.find(
        (teacher) => teacher.id === initialTeacherId,
      );
      if (selectedTeacher) {
        setFormData((prev) => ({
          ...prev,
          teacher: selectedTeacher.name,
          teacherId: selectedTeacher.id,
          teacherEmail: selectedTeacher.email || '', // Store the teacher's email
          color: selectedTeacher.color || prev.color,
        }));
      }
    }
  }, [initialTeacherId, teachers, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleColorClick = (event) => {
    setColorAnchorEl(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      color: color,
    }));
    handleColorClose();
  };

  const handleStudentClick = (event) => {
    setStudentAnchorEl(event.currentTarget);
    setSearchQuery('');
  };

  const handleStudentClose = () => {
    setStudentAnchorEl(null);
  };

  const handleStudentToggle = (student) => {
    const currentStudents = [...formData.students];
    const studentIndex = currentStudents.indexOf(student);

    if (studentIndex === -1) {
      currentStudents.push(student);
    } else {
      currentStudents.splice(studentIndex, 1);
    }

    setFormData({
      ...formData,
      students: currentStudents,
    });
  };

  const handleRemoveStudent = (student) => {
    const currentStudents = [...formData.students];
    const studentIndex = currentStudents.indexOf(student);

    if (studentIndex !== -1) {
      currentStudents.splice(studentIndex, 1);
      setFormData({
        ...formData,
        students: currentStudents,
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleTeacherClick = (event) => {
    setTeacherAnchorEl(event.currentTarget);
    setTeacherSearchQuery('');
  };

  const handleTeacherClose = () => {
    setTeacherAnchorEl(null);
  };

  const handleTeacherSelect = (teacherName, teacherId, teacherColor) => {
    // Find the selected teacher to get their email
    const selectedTeacher = teachers.find(teacher => teacher.id === teacherId);
    const teacherEmail = selectedTeacher?.email || '';
    
    setFormData({
      ...formData,
      teacher: teacherName,
      teacherId: teacherId,
      teacherEmail: teacherEmail, // Store the teacher's email
      color: teacherColor || formData.color,
    });
    handleTeacherClose();
  };

  const handleTeacherSearchChange = (event) => {
    setTeacherSearchQuery(event.target.value);
  };

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  const validateForm = () => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.duration) {
      errors.duration = 'Duration is required';
    }

    if (!formData.teacher) {
      errors.teacher = 'Teacher is required';
    }

    if (!formData.teacherId) {
      errors.teacherId = 'Teacher ID is required';
    }

    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }

    if (!formData.branch) {
      errors.branch = 'Branch is required';
    }

    if (!formData.students || formData.students.length === 0) {
      errors.students = 'At least one student must be selected';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: initialDate || formattedDate,
      startTime: initialTime || '',
      duration: '1 hour',
      endTime: '',
      displayEndTime: '',
      teacher: initialTeacherId ? (teachers.find(t => t.id === initialTeacherId)?.name || '') : '',
      teacherId: initialTeacherId || null,
      teacherEmail: initialTeacherId ? (teachers.find(t => t.id === initialTeacherId)?.email || '') : '', // Store the teacher's email
      subject: '',
      branch: '',
      students: [],
      location: '',
      color: initialTeacherId ? (teachers.find(t => t.id === initialTeacherId)?.color || '#4285F4') : '#4285F4',
    });
    setErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const eventData = {
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          date: new Date(formData.date).toISOString(),
          startTime: formData.startTime,
          duration: formData.duration,
          endTime: formData.endTime || '',
          teacher: formData.teacher, // Use teacher name as the primary field
          teacherId: formData.teacherId, // Keep teacher ID as a reference
          teacherEmail: formData.teacherEmail, // Include teacher email for filtering
          subject: formData.subject,
          branch: formData.branch,
          students: formData.students.map(studentName => {
            return {
              name: studentName,
              attendance: 'absent',
              arrivalTime: null,
              departureTime: null
            };
          }),
          location: formData.location?.trim() || '',
          color: formData.color || '#4285F4'
        };

        // Log the event data for debugging
        console.log('Submitting event data:', {
          teacherId: formData.teacherId,
          teacherName: formData.teacher,
          teacherEmail: formData.teacherEmail,
          eventDataTeacher: eventData.teacher
        });

        if (eventData.startTime) {
          if (!eventData.startTime.includes(':')) {
            eventData.startTime = `${eventData.startTime}:00`;
          }
          
          const [hours, minutes] = eventData.startTime.split(':');
          const parsedHours = parseInt(hours, 10);
          const parsedMinutes = parseInt(minutes || '0', 10);
          
          if (!isNaN(parsedHours) && !isNaN(parsedMinutes)) {
            eventData.startTime = `${parsedHours.toString().padStart(2, '0')}:${parsedMinutes.toString().padStart(2, '0')}`;
          }
        }
        
        if (eventData.endTime) {
          if (!eventData.endTime.includes(':')) {
            eventData.endTime = `${eventData.endTime}:00`;
          }
          
          const [hours, minutes] = eventData.endTime.split(':');
          const parsedHours = parseInt(hours, 10);
          const parsedMinutes = parseInt(minutes || '0', 10);
          
          if (!isNaN(parsedHours) && !isNaN(parsedMinutes)) {
            eventData.endTime = `${parsedHours.toString().padStart(2, '0')}:${parsedMinutes.toString().padStart(2, '0')}`;
          }
        }

        const response = await api.post('/create-form', eventData);

        if (response.status === 201 && response.data) {
          const calendarEvent = {
            ...response.data,
            id: response.data._id,
            teacherId: response.data.teacher,
            teacher: formData.teacher,
            color: response.data.color || eventData.color,
            eventType: 'calendar',
            isNotification: false
          };

          resetForm();
          
          onSubmit(calendarEvent);
          onClose();
        } else {
          throw new Error(response.data?.message || 'Failed to create event');
        }
      } catch (error) {
        console.error('Error creating event:', error);
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to create event. Please try again.';
        setSubmitError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const colorOpen = Boolean(colorAnchorEl);
  const studentOpen = Boolean(studentAnchorEl);
  const teacherOpen = Boolean(teacherAnchorEl);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          overflow: 'visible',
          width: '700px',
          maxWidth: '90vw',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: formData.color,
          color: '#ffffff',
        }}
      >
        <Typography variant="h6" component="div">
          Create New Event
        </Typography>
        <IconButton 
          onClick={handleClose} 
          sx={{ color: '#ffffff' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent 
        dividers
        sx={{ p: 0 }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}></Box>
          <TextField
            name="title"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={handleInputChange}
            margin="normal"
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
          />

          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <AccessTimeIcon
                  sx={{ mt: 4, mr: 1, color: 'text.secondary' }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="start-time-label">Start Time</InputLabel>
                  <Select
                    labelId="start-time-label"
                    name="startTime"
                    value={formData.startTime || ''}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      const startOption = timeOptions.find(opt => opt.value === newStartTime);
                      
                      if (startOption && formData.duration) {
                        const [hours, minutes] = newStartTime.split(':').map(Number);
                        
                        const minutesToAdd = formData.duration === '1 hour 30 min' ? 90 : 
                                          formData.duration === '1 hour 15 min' ? 75 : 60;

                        let totalMinutes = hours * 60 + minutes + minutesToAdd;
                        let endHours = Math.floor(totalMinutes / 60);
                        if (endHours >= 24) endHours -= 24;
                        const endMinutes = totalMinutes % 60;

                        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                        
                        const displayEndHour = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
                        const ampm = endHours >= 12 ? 'PM' : 'AM';
                        const displayEndTime = `${displayEndHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;

                        setFormData({
                          ...formData,
                          startTime: newStartTime,
                          endTime: endTime,
                          displayEndTime: displayEndTime
                        });
                      } else {
                        setFormData({
                          ...formData,
                          startTime: newStartTime,
                          endTime: '',
                          displayEndTime: ''
                        });
                      }
                    }}
                    label="Start Time"
                  >
                    {timeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="duration-label">Duration</InputLabel>
                <Select
                  labelId="duration-label"
                  name="duration"
                  value={formData.duration || ''}
                  onChange={(e) => {
                    const newDuration = e.target.value;
                    
                    if (formData.startTime) {
                      const [hours, minutes] = formData.startTime.split(':').map(Number);
                      
                      const minutesToAdd = newDuration === '1 hour 30 min' ? 90 : 
                                        newDuration === '1 hour 15 min' ? 75 : 60;

                      let totalMinutes = hours * 60 + minutes + minutesToAdd;
                      let endHours = Math.floor(totalMinutes / 60);
                      if (endHours >= 24) endHours -= 24;
                      const endMinutes = totalMinutes % 60;

                      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                      
                      const displayEndHour = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
                      const ampm = endHours >= 12 ? 'PM' : 'AM';
                      const displayEndTime = `${displayEndHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;

                      setFormData({
                        ...formData,
                        duration: newDuration,
                        endTime: endTime,
                        displayEndTime: displayEndTime
                      });
                    } else {
                      setFormData({
                        ...formData,
                        duration: newDuration,
                        endTime: '',
                        displayEndTime: ''
                      });
                    }
                  }}
                  label="Duration"
                >
                  {['1 hour', '1 hour 15 min', '1 hour 30 min'].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <AccessTimeIcon sx={{ mt: 4, mr: 1, color: 'text.secondary' }} />
                <FormControl fullWidth margin="normal">
                  <TextField
                    value={formData.displayEndTime || ''}
                    label="End Time"   
                    disabled
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <PersonIcon sx={{ mt: 4, mr: 1, color: 'text.secondary' }} />
                <FormControl fullWidth margin="normal">
                  <Box
                    onClick={handleTeacherClick}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      p: 1,
                      minHeight: '56px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {formData.teacher ? formData.teacher : 'Select Teacher'}
                  </Box>
                  <Popover
                    open={teacherOpen}
                    anchorEl={teacherAnchorEl}
                    onClose={handleTeacherClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                  >
                    <Box sx={{ width: '250px' }}>
                      <TextField
                        placeholder="Search teachers"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={teacherSearchQuery}
                        onChange={handleTeacherSearchChange}
                        sx={{ m: 2 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map((teacher) => (
                            <ListItem
                              key={teacher.id}
                              dense
                              button
                              onClick={() =>
                                handleTeacherSelect(
                                  teacher.name,
                                  teacher.id,
                                  teacher.color,
                                )
                              }
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.04)',
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  backgroundColor: teacher.color || '#ccc',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  mr: 1,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {teacher.name.split(' ').reduce((initials, part, index) => 
                                  initials + (part[0] || ''), '')}
                              </Box>
                              <ListItemText primary={teacher.name} />
                            </ListItem>
                          ))
                        ) : (
                          <ListItem>
                            <ListItemText primary="No teachers found" />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Popover>
                </FormControl>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <SubjectIcon sx={{ mt: 4, mr: 1, color: 'text.secondary' }} />
                <FormControl fullWidth margin="normal" error={!!errors.subject}>
                  <InputLabel id="subject-label">Subject</InputLabel>
                  <Select
                    labelId="subject-label"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    label="Subject"
                    disabled={loading}
                  >
                    {subjects?.map((subject) => (
                      <MenuItem 
                        key={subject._id} 
                        value={subject.name}
                      >
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subject && (
                    <FormHelperText>{errors.subject}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <AccountTreeIcon
                  sx={{ mt: 4, mr: 1, color: 'text.secondary' }}
                />
                <FormControl fullWidth margin="normal" error={!!errors.branch}>
                  <InputLabel id="branch-label">Branch</InputLabel>
                  <Select
                    labelId="branch-label"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    label="Branch"
                    disabled={loading}
                  >
                    {branches?.map((branch) => (
                      <MenuItem 
                        key={branch._id || branch.id} 
                        value={branch.name}
                      >
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.branch && (
                    <FormHelperText>{errors.branch}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <GroupIcon sx={{ mt: 4, mr: 1, color: 'text.secondary' }} />
                <FormControl fullWidth margin="normal" error={!!errors.students}>
                  <Box
                    onClick={handleStudentClick}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      minHeight: '56px',
                      cursor: 'pointer',
                    }}
                  >
                    {formData.students.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {formData.students.map((studentName) => (
                          <Chip
                            key={studentName}
                            label={studentName}
                            onDelete={() => handleRemoveStudent(studentName)}
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">
                        Select Students
                      </Typography>
                    )}
                  </Box>
                  {errors.students && (
                    <FormHelperText>{errors.students}</FormHelperText>
                  )}
                  <Popover
                    open={Boolean(studentAnchorEl)}
                    anchorEl={studentAnchorEl}
                    onClose={handleStudentClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <Box sx={{ width: 300, p: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                        {loading ? (
                          <ListItem>
                            <ListItemText primary="Loading students..." />
                          </ListItem>
                        ) : filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <ListItem
                              key={student._id}
                              dense
                              button
                              onClick={() => handleStudentToggle(student.name)}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={formData.students.includes(student.name)}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemText primary={student.name} />
                            </ListItem>
                          ))
                        ) : (
                          <ListItem>
                            <ListItemText 
                              primary={searchQuery ? "No matching students found" : "No students available"}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Popover>
                </FormControl>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LocationOnIcon
                  sx={{ mt: 4, mr: 1, color: 'text.secondary' }}
                />
                <TextField
                  name="location"
                  label="Location"
                  fullWidth
                  value={formData.location}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <CircleIcon sx={{ mt: 4, mr: 1, color: formData.color }} />
                <FormControl fullWidth margin="normal">
                  <InputLabel shrink>Color</InputLabel>
                  <Box
                    onClick={handleColorClick}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      p: 1,
                      mt: 2,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: formData.color,
                      color: '#ffffff',
                      minHeight: '40px',
                    }}
                  >
                    Select Color
                  </Box>
                  <Popover
                    open={colorOpen}
                    anchorEl={colorAnchorEl}
                    onClose={handleColorClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1,
                      }}
                    >
                      {colorOptions.map((color) => (
                        <Box
                          key={color.value}
                          onClick={() => handleColorSelect(color.value)}
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: color.value,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border:
                              formData.color === color.value
                                ? '2px solid #000'
                                : 'none',
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Popover>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {submitError && (
          <Typography color="error" sx={{ flex: 1, mr: 2 }}>
            {submitError}
          </Typography>
        )}
        <Button 
          onClick={handleClose}
          disabled={isSubmitting}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || loading}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          color="primary"
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewEventForm;