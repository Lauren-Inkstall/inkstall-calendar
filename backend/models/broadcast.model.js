import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startAt: {
    type: Date,
    default: Date.now,
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export default Broadcast;