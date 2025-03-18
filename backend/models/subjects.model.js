import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // other fields if needed
});

const Subject = mongoose.model('subjects', subjectSchema);
export default Subject;
