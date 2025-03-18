import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItem, ListItemIcon, Typography, Divider, Button, IconButton, AppBar, Toolbar, Chip, Tooltip, useTheme, useMediaQuery } from "@mui/material";import MenuIcon from "@mui/icons-material/Menu";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineTaskAlt } from "react-icons/md";
import { FaDatabase, FaRegBell, FaRegCalendar } from "react-icons/fa";
import { GrGroup, GrUserSettings } from "react-icons/gr";
import { LiaUserSolid } from "react-icons/lia";
import { TbLogout } from "react-icons/tb";
import { motion } from "framer-motion";
import { LuClipboard } from "react-icons/lu";
import pfp from "../../assets/Images/pfp.jpeg";
import { useAuth } from "../../context/AuthContext";
import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineChartBar } from "react-icons/hi";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import useTeacherPoints from "../../hooks/useMyTeacherPoints";
import { Badge, Popover, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { useNotification } from "../../context/NotificationContext";
import { MdAnnouncement } from "react-icons/md";
import { toast } from "react-toastify";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const drawerWidth = 240;
  const [profileImage, setProfileImage] = useState(pfp);
  const { notifications, unreadCount, markAsRead, createBroadcast } = useNotification();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  // Get teacher points
  const { points, loading: pointsLoading, fetchPoints } = useTeacherPoints();

  // Get user info from localStorage
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole')?.toLowerCase() || 'guest';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Add these functions inside the Layout component
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = (notificationId) => {
    markAsRead(notificationId);
  };

  // Simple approach to load profile image
  useEffect(() => {
    // Get the profile image URL from localStorage
    const localPhotoUrl = localStorage.getItem('localPhotoUrl');
    
    if (localPhotoUrl && localPhotoUrl.trim() !== '') {
      console.log('Found profile image URL in localStorage:', localPhotoUrl);
      
      // Create a test image to check if the URL is valid
      const testImg = new Image();
      
      // If the image loads successfully, use it
      testImg.onload = () => {
        console.log('Profile image loaded successfully');
        setProfileImage(localPhotoUrl);
      };
      
      // If the image fails to load, use the default
      testImg.onerror = () => {
        console.error('Failed to load profile image from URL:', localPhotoUrl);
        setProfileImage(pfp);
      };
      
      // Start loading the image
      testImg.src = localPhotoUrl;
    } else {
      console.log('No profile image URL found in localStorage');
    }
  }, []); // Only run once on component mount
  
  // Refresh points data when route changes
  useEffect(() => {
    // Only fetch points if user is a teacher
    if (userRole === 'teacher' || userRole === 'admin' || userRole === 'superadmin') {
      fetchPoints();
    }
  }, [location.pathname]);

  // Generate dashboard title based on user role
  const getDashboardTitle = () => {
    switch(userRole) {
      case 'superadmin':
        return 'SuperAdmin Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      case 'teacher':
        return 'Teacher Dashboard';
      default:
        return 'Dashboard';
    }
  };

  // console.log('Layout - Current user:', { userName, userRole }); // Debug log

  // Check authentication
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    // console.log('Not authenticated, redirecting to login');
    navigate('/login');
    return null;
  }

  // Define which menu items are restricted to admin/super-admin
  const adminOnlyPaths = ['/admin', '/teachers', '/settings', '/students'];

  const menuItems = [
    {
      text: "Today's Attendance",
      icon: <IoHomeOutline size={20} />,
      path: "/", 
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "My Attendance",
      icon: <MdOutlineTaskAlt size={20} />,
      path: "/my-attendance",
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "Daily Updates",
      icon: <FaRegBell size={20} />,
      path: "/daily-updates",
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "Test Submission",
      icon: <LuClipboard size={20} />,
      path: "/test-submission",
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "Calendar",
      icon: <FaRegCalendar size={20} />,
      path: "/calendar",
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "Activity Points",
      icon: <EmojiEventsIcon size={20} />,
      path: "/teacher-points",
      allowedRoles: ['admin', 'superadmin','teacher']
    },
    {
      text: "Students",
      icon: <LiaUserSolid size={20} />,
      path: "/students",
      allowedRoles: ['admin', 'superadmin']
    },
    {
      text: "Students Database",
      icon: <FaDatabase size={20} />,
      path: "/students-database",
      allowedRoles: ['superadmin']
    },
    {
      text: "Student Performance",
      icon: <HiOutlineChartBar size={20} />,
      path: "/student-performance",
      allowedRoles: ['admin', 'superadmin', 'teacher']
    },
    {
      text: "Teachers",
      icon: <GrGroup size={20} />,
      path: "/teachers",
      allowedRoles: ['admin', 'superadmin']
    },
    {
      text: "Admin",
      icon: <GrUserSettings size={20} />,
      path: "/admin",
      allowedRoles: ['admin', 'superadmin']
    },
    {
      text: "Settings",
      icon: <IoSettingsOutline size={20} />,
      path: "/settings",
      allowedRoles: ['admin', 'superadmin']
    }
  ];

  // Redirect from protected routes if user doesn't have access
  useEffect(() => {
    if (adminOnlyPaths.includes(location.pathname) && !['admin', 'superadmin'].includes(userRole)) {
      navigate('/todays-attendance');
    }
  }, [location.pathname, userRole]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Announcement modal state
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [startDate, setStartDate] = useState(dayjs());
  const [expirationDate, setExpirationDate] = useState(dayjs().add(1, 'day'));
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // Handle announcement modal
  const handleAnnouncementOpen = () => {
    setAnnouncementOpen(true);
  };

  const handleAnnouncementClose = () => {
    setAnnouncementOpen(false);
    setAnnouncementMessage('');
    setStartDate(dayjs()); // Reset start date to current time
    setExpirationDate(dayjs().add(1, 'day'));
  };

const handleAnnouncementSubmit = async () => {
  if (!announcementMessage.trim()) {
    toast.error('Announcement message cannot be empty');
    return;
  }

  // Validate dates
  if (startDate.isAfter(expirationDate)) {
    toast.error('Start date cannot be after expiration date');
    return;
  }

  setAnnouncementLoading(true);
  try {
    const result = await createBroadcast(
      announcementMessage, 
      startDate.toISOString(), 
      expirationDate.toISOString()
    );
    if (result.success) {
      toast.success('Announcement sent successfully');
      handleAnnouncementClose();
    } else {
      toast.error(result.error || 'Failed to send announcement');
    }
  } catch (error) {
    console.error('Error sending announcement:', error);
    toast.error('An error occurred while sending the announcement');
  } finally {
    setAnnouncementLoading(false);
  }
};

  return (
    <Box sx={{ display: "flex", scrollBehavior: "smooth" }}>
      <AppBar position="fixed" sx={{ backgroundColor: "#fff", boxShadow: "none" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer}>
              <MenuIcon sx={{ color: "black" }} />
            </IconButton>
            
            {/* Points display for teachers */}
            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'superadmin') && (
              <Tooltip title="Click to view detailed points breakdown" arrow>
                <Chip
                  icon={<EmojiEventsIcon sx={{ color: '#FFD700 !important' }} />}
                  label={!pointsLoading && points ? `${points.totalPoints} Points` : 'Loading...'}
                  onClick={() => navigate('/teacher-points')}
                  sx={{
                    ml: 2,
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #2196f3 30%, #3f51b5 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                    },
                    cursor: 'pointer'
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Announcement Button (Superadmin only) */}
            {userRole === 'superadmin' && (
              <Tooltip title="Create Announcement" arrow>
                <IconButton
                  color="inherit"
                  onClick={handleAnnouncementOpen}
                  sx={{ color: "#000" }}
                >
                  <MdAnnouncement size={20} />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Notification Bell */}
            <IconButton 
              color="inherit" 
              onClick={handleNotificationClick}
              sx={{ color: "#000" }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <FaRegBell size={20} />
              </Badge>
            </IconButton>
            
            {/* User Profile */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#fff", px: "8px", py: "4px", borderRadius: "12px", boxShadow: 1 }}>
              <img 
                src={profileImage} 
                alt="Profile" 
                style={{ 
                  height: "40px", 
                  width: "40px", 
                  borderRadius: "50%",
                  objectFit: "cover"
                }} 
                onError={(e) => {
                  console.error('Failed to load profile image in img tag:', e.target.src);
                  e.target.onerror = null; 
                  e.target.src = pfp;
                }}
              />
              <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", gap: "-1rem" }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#000" }}>{userName}</Typography>
                <span style={{ fontSize: "12px", fontWeight: 100, color: "gray" }}>{userRole}</span>
              </Box>
              <TbLogout cursor="pointer" color="#000" fontSize="22px" onClick={handleLogout} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Notifications
          </Typography>
          
          {notifications.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
              No notifications
            </Typography>
          ) : (
            notifications.map((notification) => (
              <Box 
                key={notification._id}
                sx={{ 
                  p: 1.5, 
                  mb: 1, 
                  borderRadius: 1,
                  backgroundColor: notification.hasRead ? 'transparent' : 'rgba(254, 204, 0, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                  cursor: 'pointer'
                }}
                onClick={() => handleNotificationItemClick(notification._id)}
              >
                <Typography variant="body2" sx={{ fontWeight: notification.hasRead ? 400 : 600 }}>
                  {notification.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {notification.senderName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dayjs(notification.createdAt).fromNow()}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>
      
      <motion.div animate={{ width: open ? drawerWidth : 0 }} transition={{ duration: 0.3 }}>
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              transition: "width 0.3s ease-in-out",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              color: "#000",
              border: "none",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "100%"
            },
          }}
        >
          {/* Top section with hamburger menu */}
          <Box sx={{ 
            p: 2, 
            display: "flex", 
            justifyContent: "flex-end"
          }}>
            <IconButton onClick={toggleDrawer} sx={{ color: "black" }}>
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Logo and dashboard title */}
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            mb: 2
          }}>
            <img 
              src="https://static.wixstatic.com/shapes/abaee8_dc6d6d64fba440848d2b9769e4f2e998.svg" 
              alt="Inkstall Logo" 
              style={{ height: "60px", width: "auto", marginBottom: "8px" }} 
            />
            <Typography sx={{ 
              fontSize: "16px", 
              color: "#000",
              fontWeight: 500 
            }}>
              {getDashboardTitle()}
            </Typography>
          </Box>
          
          <Divider />
          
          {/* Menu items in scrollable container */}
          <Box sx={{ 
            flex: 1,
            overflowY: "auto",
            py: 1
          }}>
            <List sx={{ px: 1 }}>
              {menuItems
                .filter(item => {
                  const hasAccess = item.allowedRoles.includes(userRole);
                  return hasAccess;
                })
                .map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false); // Close the drawer after navigation
                  }}
                  sx={{
                    mb: 0.5,
                    py: 1.5,
                    borderRadius: 0,
                    borderLeft: location.pathname === item.path ? '4px solid #fecc00' : '4px solid transparent',
                    backgroundColor: location.pathname === item.path ? 'rgba(254, 204, 0, 0.1)' : 'transparent',
                    color: '#555',
                    "&:hover": { 
                      backgroundColor: 'rgba(254, 204, 0, 0.1)',
                      cursor: 'pointer',
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: location.pathname === item.path ? '#000' : '#000', 
                    minWidth: 40,
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <Typography sx={{ 
                    fontSize: "15px",
                    fontWeight: location.pathname === item.path ? 500 : 400,
                    color: location.pathname === item.path ? '#000' : '#000',
                  }}>
                    {item.text}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
          
          {/* Logout button fixed at bottom */}
          <Box sx={{ 
            borderTop: "1px solid #eee",
            bgcolor: "#fff",
            mt: "auto",
            p: 0
          }}>
            <ListItem
              button
              onClick={handleLogout}
              sx={{
                py: 1.5,
                
                color: '#555',
                "&:hover": { 
                  backgroundColor: '#FECC00',
                  cursor: 'pointer',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#000', minWidth: 40 }}>
                <TbLogout size={20} />
              </ListItemIcon>
              <Typography sx={{ fontSize: "15px" }}>
                Logout
              </Typography>
            </ListItem>
          </Box>
        </Drawer>
      </motion.div>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: `calc(100% - ${open ? drawerWidth : 0}px)`, 
          transition: "width 0.3s ease-in-out", 
          minHeight: "100vh", 
          backgroundColor: "#f5f5f5", 
          pt: 8 
        }}
      >
        <Outlet />
      </Box>

      {/* Announcement Modal */}
      <Dialog open={announcementOpen} onClose={handleAnnouncementClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Announcement Message"
              multiline
              rows={4}
              fullWidth
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Enter your announcement message here..."
              variant="outlined"
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Start Date & Time"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
              <DateTimePicker
                label="Expiration Date & Time"
                value={expirationDate}
                onChange={(newValue) => setExpirationDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnnouncementClose}>Cancel</Button>
          <Button 
            onClick={handleAnnouncementSubmit} 
            variant="contained" 
            color="primary"
            disabled={announcementLoading || !announcementMessage.trim()}
          >
            {announcementLoading ? 'Sending...' : 'Send Announcement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;