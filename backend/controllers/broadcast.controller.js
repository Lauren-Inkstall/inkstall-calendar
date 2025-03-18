import Broadcast from '../models/broadcast.model.js';

// Create a new broadcast message (superadmin only)
export const createBroadcast = async (req, res) => {
  try {
    const { message, startAt, expiresAt } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Broadcast message cannot be empty' });
    }
    
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can create broadcast messages' });
    }
    
    const broadcast = new Broadcast({
      message,
      sender: req.user._id,
      senderName: req.user.name || 'SuperAdmin',
      startAt: startAt || new Date(), // Use provided startAt or current time
      expiresAt: expiresAt || null
    });
    
    await broadcast.save();
    
    res.status(201).json({ 
      message: 'Broadcast message sent successfully',
      broadcast
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all broadcast messages
export const getAllBroadcasts = async (req, res) => {
  try {
    // Only get broadcasts that are active (after startAt and before expiresAt)
    const currentDate = new Date();
    const broadcasts = await Broadcast.find({
      $and: [
        { startAt: { $lte: currentDate } }, // Start time has passed
        { 
          $or: [
            { expiresAt: { $gt: currentDate } }, // Not expired yet
            { expiresAt: null } // No expiration date
          ]
        }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Mark if current user has read each message
    const enhancedBroadcasts = broadcasts.map(broadcast => {
      const broadcastObj = broadcast.toObject();
      const hasRead = broadcast.readBy.some(reader => 
        reader.userId.toString() === req.user._id.toString()
      );
      
      return {
        ...broadcastObj,
        hasRead
      };
    });
    
    res.status(200).json(enhancedBroadcasts);
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a broadcast as read
export const markAsRead = async (req, res) => {
  try {
    const { broadcastId } = req.params;
    
    const broadcast = await Broadcast.findById(broadcastId);
    
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }
    
    // Check if user has already read this broadcast
    const alreadyRead = broadcast.readBy.some(reader => 
      reader.userId.toString() === req.user._id.toString()
    );
    
    if (!alreadyRead) {
      broadcast.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });
      
      await broadcast.save();
    }
    
    res.status(200).json({ message: 'Broadcast marked as read' });
  } catch (error) {
    console.error('Error marking broadcast as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unread count for current user
export const getUnreadCount = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find();
    
    const unreadCount = broadcasts.filter(broadcast => {
      return !broadcast.readBy.some(reader => 
        reader.userId.toString() === req.user._id.toString()
      );
    }).length;
    
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};