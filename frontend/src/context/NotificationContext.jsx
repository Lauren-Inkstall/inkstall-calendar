import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all broadcasts
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/broadcast');
      setNotifications(response.data);
      
      // Count unread notifications
      const unread = response.data.filter(notification => !notification.hasRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/broadcast/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, hasRead: true } 
            : notification
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

    // Create a new broadcast (superadmin only)
    const createBroadcast = async (message, startAt, expiresAt) => {
    try {
        const response = await api.post('/broadcast', { message, startAt, expiresAt });
        
        // Add new notification to the list
        setNotifications(prev => [response.data.broadcast, ...prev]);
        
        return { success: true };
    } catch (error) {
        console.error('Error creating broadcast:', error);
        return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send broadcast message' 
        };
    }
    };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        fetchNotifications, 
        markAsRead, 
        createBroadcast 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};