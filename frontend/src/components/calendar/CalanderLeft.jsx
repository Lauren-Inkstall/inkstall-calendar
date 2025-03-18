import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NewEventForm from './NewEventForm';
import MiniCalendar from './MiniCalendar';
import TeacherSearch from './TeacherSearch'; // Import the new component

// Get initials from name
const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const CalanderLeft = ({
  onAddEvent,
  onDateSelect,
  selectedDate,
  teachers,
  onToggleTeacher,
  userRole, // Add userRole to the props
  currentUserId, // Add currentUserId to the props
  currentUserName, // Add currentUserName to the props
}) => {
  const [openEventForm, setOpenEventForm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');

  // Get user email from localStorage on component mount
  React.useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
  }, []);

  // Check if user is admin or superadmin (not teacher)
  const canCreateEvents = userRole === 'admin' || userRole === 'superadmin';

  // Filter teachers based on user role and email/ID
  const displayedTeachers = userRole === 'teacher'
    ? teachers.filter(teacher => {

        // Try to match by ID first (most reliable)
        if (currentUserId && teacher.id === currentUserId) {
          return true;
        }
        
        // For Test0001 case, exact username match
        if (currentUserName && teacher.name) {
          const exactNameMatch = teacher.name.toLowerCase() === currentUserName.toLowerCase();
          if (exactNameMatch) {
            return true;
          }
        }
        
        // Try to match by exact email
        if (userEmail && teacher.email) {
          const exactEmailMatch = teacher.email.toLowerCase() === userEmail.toLowerCase();
          if (exactEmailMatch) {
            return true;
          }
        }
        
        // As a last resort, check for username in teacher name or vice versa
        // But only if the match is very specific (to avoid false positives)
        if (currentUserName && teacher.name) {
          // Only consider this a match if one is fully contained in the other
          // and they share at least 5 characters (to avoid matching short names like "test")
          const userNameLower = currentUserName.toLowerCase();
          const teacherNameLower = teacher.name.toLowerCase();
          
          // Check if one contains the other completely
          const nameContainedInTeacher = teacherNameLower.includes(userNameLower) && userNameLower.length >= 5;
          const teacherContainedInName = userNameLower.includes(teacherNameLower) && teacherNameLower.length >= 5;
          
          if (nameContainedInTeacher || teacherContainedInName) {
            return true;
          }
        }
        
        return false;
      })
    : teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

  const handleToggle = (id) => {
    if (onToggleTeacher) {
      onToggleTeacher(id);
    }
  };

  const handleOpenEventForm = () => {
    setOpenEventForm(true);
  };

  const handleCloseEventForm = () => {
    setOpenEventForm(false);
  };

  const handleSubmitEvent = (eventData) => {
    if (onAddEvent) {
      onAddEvent(eventData);
    }
    handleCloseEventForm();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '250px',
        display: 'flex',
        p: 1,
        flexDirection: 'column',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      {/* Add Event Button - Only show for admin and superadmin */}
      {canCreateEvents && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenEventForm}
          sx={{
            width: '130px',
            mb: 1,
            textTransform: 'none',
            fontSize: '0.85rem',
            p: 1,
            backgroundColor: 'white', // Set background to white
            color: 'black', // Set text color to black
            borderRadius: '20px', // Add border radius
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Add box shadow
            '&:hover': {
              // Optional: Add hover effect
              backgroundColor: '#f0f0f0',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            },
          }}
          fullWidth
        >
          Create
        </Button>
      )}
      {/* Mini Calendar */}
      <Box sx={{ mt: canCreateEvents ? 0 : 0, mr: 1}}>
        <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </Box>

      {/* Teacher Search - Added the new component here */}
      <TeacherSearch onSearch={handleSearch} />

      {/* Teachers List */}
      <Box
        sx={{
          mb: 1,
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{
            px: 1,
            mb: 1,
            fontSize: '0.85rem',
          }}
        >
          Teachers
        </Typography>
        <List
          dense
          disablePadding
          sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}
        >
          {displayedTeachers.map((teacher) => (
            <ListItem
              key={teacher.id}
              dense
              button
              onClick={() => userRole !== 'teacher' && handleToggle(teacher.id)}
              sx={{
                py: 0.5,
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  checked={teacher.checked}
                  onChange={() => userRole !== 'teacher' && onToggleTeacher(teacher.id)}
                  disabled={userRole === 'teacher'} // Disable checkbox for teachers
                  tabIndex={-1}
                  disableRipple
                  size="small"
                  sx={{
                    color: teacher.color,
                    '&.Mui-checked': {
                      color: teacher.color,
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      pointerEvents: 'none',
                    },
                    p: 0.5,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={teacher.name}
                sx={{
                  m: 0,
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />
              <Avatar
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: teacher.color,
                  opacity: teacher.checked ? 1 : 0.5,
                  ml: 0.5,
                }}
              >
                {getInitials(teacher.name)}
              </Avatar>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* New Event Form Dialog */}
      <NewEventForm
        open={openEventForm}
        onClose={handleCloseEventForm}
        onSubmit={handleSubmitEvent}
        initialDate={selectedDate.toISOString().split('T')[0]}
        teachers={teachers}
      />
    </Box>
  );
};

CalanderLeft.propTypes = {
  onAddEvent: PropTypes.func,
  onDateSelect: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  teachers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      checked: PropTypes.bool.isRequired,
      color: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onToggleTeacher: PropTypes.func,
  userRole: PropTypes.string.isRequired, // Add userRole prop type
  currentUserId: PropTypes.string, // Add currentUserId prop type
  currentUserName: PropTypes.string.isRequired, // Add currentUserName prop type
};

export default CalanderLeft;
