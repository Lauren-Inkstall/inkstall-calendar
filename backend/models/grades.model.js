import mongoose from "mongoose";

const gradesSchema = new mongoose.Schema({
  grades: [String],
});

const Grades = mongoose.model("Grades", gradesSchema);

export default Grades;
