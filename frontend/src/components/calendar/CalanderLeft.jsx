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
}) => {
  const [openEventForm, setOpenEventForm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Check if user is admin or superadmin (not teacher)
  const canCreateEvents = userRole === 'admin' || userRole === 'superadmin';

  const filteredTeachers = teachers.filter((teacher) =>
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
        flexDirection: 'column',
        p: 1,
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
            mb: 2,
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
      <Box sx={{ mb: 2 }}>
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
          {filteredTeachers.map((teacher) => (
            <ListItem
              key={teacher.id}
              dense
              button
              onClick={() => handleToggle(teacher.id)}
              sx={{
                py: 0.5,
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  checked={teacher.checked}
                  tabIndex={-1}
                  disableRipple
                  size="small"
                  sx={{
                    color: teacher.color,
                    '&.Mui-checked': {
                      color: teacher.color,
                    },
                    p: 0.5,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={teacher.name}
                primaryTypographyProps={{
                  style: {
                    textDecoration: teacher.checked ? 'none' : 'line-through',
                    color: teacher.checked ? 'inherit' : '#9e9e9e',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
};

export default CalanderLeft;
