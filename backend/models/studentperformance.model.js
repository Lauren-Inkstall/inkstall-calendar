import mongoose from 'mongoose';

const studentPerformanceSchema = new mongoose.Schema({
    studentId: { type: String},  // Matches the studentId format in the students database
    subject: { type: String, required: true },  // Subject
    description: { type: String },  // Description (Optional)
    testType: { type: String, required: true },  // Test Type (e.g., Quiz, Exam)
    marks: { type: String, required: true },  // Marks Obtained (as String)
    totalMarks: { type: String, required: true },  // Total Marks (as String)
    submitDateTime: { type: String, required: true },  // Submission Date & Time
}, { timestamps: false });

const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);
export default StudentPerformance;