import mongoose from 'mongoose';

const teacherPointsSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  }, // Format: YYYY-MM
  dailyUpdatePoints: {
    type: Number,
    default: 0
  },
  kSheetPoints: {
    type: Number,
    default: 0
  },
  testPoints: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdAt: String,
  updatedAt: String
}, {
  versionKey: false
});

// Set timestamps before saving
teacherPointsSchema.pre('save', function(next) {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata'
  });

  if (!this.createdAt) {
    this.createdAt = now;
  }
  this.updatedAt = now;
  
  // Calculate total points
  this.totalPoints = this.dailyUpdatePoints + this.kSheetPoints + this.testPoints;
  
  next();
});

const TeacherPoints = mongoose.model('TeacherPoints', teacherPointsSchema);
export default TeacherPoints;
