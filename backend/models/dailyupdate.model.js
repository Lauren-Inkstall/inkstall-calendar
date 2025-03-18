import mongoose from "mongoose";

// Define the schema for a daily update record.
// Each update stores the date, the creator, and arrays of students and subjects.
// Each subject contains chapters, and each chapter can include K-Sheet information.
const DailyUpdateSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  teacherName: {
    type: String,
    required: true,
  },
  students: [
    {
      name: { type: String, required: true },
      grade: { type: String, required: true },
      board: { type: String, required: true },
    },
  ],
  subjects: [
    {
      name: { type: String, required: true },
      chapters: [
        {
          chapterName: { type: String, required: true },
          notes: { type: String },
          date: { type: Date, default: Date.now },
          // kSheet indicates if the chapter has a K-Sheet
          kSheet: {
            type: String,
            enum: ["no", "textual", "yes"],
            default: "no",
            required: true,
          },
          // This field stores the Nextcloud URL after upload
          kSheetUrl: { type: String },
          chapterCompletion: {
            type: String,
            required: true,
            default: "pending",
          },
        },
      ],
    },
  ],
  branch: {
    type: String,
    required: true,
  },
  message: {
    type: Boolean,
    default: false,
  },
});

const DailyUpdate = mongoose.model("DailyUpdate", DailyUpdateSchema);
export default DailyUpdate;
