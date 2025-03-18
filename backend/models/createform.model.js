import mongoose from 'mongoose';

const CreateFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: String, required: true },
  endTime: { type: String },
  teacher: { type: String, required: true },
  subject: { type: String, required: true },
  branch: { type: String, required: true },
  students: [{
    name: { type: String, required: true },
    attendance: { type: String, default: 'absent', enum: ['present', 'absent'] },
    arrivalTime: { type: String },
    departureTime: { type: String },
  }],
  location: { type: String },
  color: { type: String, default: '#4285F4' }
}, { timestamps: true });

const CreateForm = mongoose.model('CreateForm', CreateFormSchema);

export default CreateForm;