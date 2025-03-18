import mongoose from "mongoose";

const TestSubmissionSchema = new mongoose.Schema({
  submissionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  proposedDate: {
    type: Date,
    required: true,
  },
  branch: {
    type: String,
    required: true, // Make it required if needed
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  students: [
    {
      name: {
        type: String,
        required: true,
      },
      grade: {
        type: String,
        required: true,
      },
    },
  ],
  subject: {
    name: {
      type: String,
      required: true,
    },
    chapters: [
      {
        chapterName: {
          type: String,
          required: true,
        },
      },
    ],
    notes: {
      type: String,
      default: "No notes provided",
    },
    uploadTestFileUrl: {
      type: String,
      default: "No file uploaded",
    },
  },
});

const TestSubmission = mongoose.model("testsubmission", TestSubmissionSchema);
export default TestSubmission;
