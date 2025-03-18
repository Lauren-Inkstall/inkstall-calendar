// DailyUpdates.jsx
import React, { useContext, useState } from "react";
import MainFrame from "./ui/MainFrame";
import {
  Box,
  Typography,
  Button,
  Autocomplete,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextareaAutosize,
} from "@mui/material";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { Close } from "@mui/icons-material";
import { FiCheck, FiX, FiFileText } from "react-icons/fi";
import api from "../api";
import { StudentsContext } from "../context/StudentContext";
import { SubjectsContext } from "../context/SubjectsContext";
import { InfoContext } from "../context/InfoContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useTeacherPoints from "../hooks/useMyTeacherPoints";

const DailyUpdates = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([
    { student: "", selectedGrade: "", selectedBoard: "" },
  ]);
  const [listAllSubject, setListAllSubject] = useState([]);
  const [studentBranch, setStudentBranch] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [kSheetGiven, setKSheetGiven] = useState("no");
  const [chapterCompletion, setChapterCompletion] = useState("0%");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [date, setDate] = useState(
    `Today (${new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\s/g, " ")})`
  );

  // Points system state
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(null);
  // Destructure teacher points functions from the hook
  const { points, playCoinSound, fetchPoints, showPointsToast } = useTeacherPoints();

  const { students: allStudentsList, loading: studentsLoading } =
    useContext(StudentsContext);
  const { subjects: subjectsList, loading: subjectsLoading } =
    useContext(SubjectsContext);
  const { branches } = useContext(InfoContext);

  // Utility function for date formatting
  const formatDate = (date) => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options).replace(/\s/g, " ");
  };
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayOption = `Today (${formatDate(today)})`;
  const yesterdayOption = `Yesterday (${formatDate(yesterday)})`;

  const handleStudentChange = (index, value) => {
    const updatedStudents = [...selectedStudents];
    const selectedStudent = allStudentsList.find((s) => s.name === value);

    if (selectedStudent) {
      const subjectNames = selectedStudent.subjects.map((subj) => subj.name);
      setListAllSubject((prevSubjects) => {
        const matchedSubjects = prevSubjects.filter((subj) =>
          subjectNames.includes(subj)
        );
        return matchedSubjects.length > 0
          ? [...new Set(matchedSubjects)]
          : [...new Set(subjectNames)];
      });
    }
    updatedStudents[index] = {
      student: value,
      selectedGrade: selectedStudent ? selectedStudent.grade : "",
      selectedBoard: selectedStudent ? selectedStudent.board : "",
    };
    setSelectedStudents(updatedStudents);
  };

  const addStudentField = () => {
    setSelectedStudents([
      ...selectedStudents,
      { student: "", selectedGrade: "", selectedBoard: "" },
    ]);
  };

  const deleteStudentField = (index) => {
    if (selectedStudents.length > 1) {
      setSelectedStudents(selectedStudents.filter((_, i) => i !== index));
    }
  };

  const getAvailableStudents = (index) => {
    return allStudentsList.filter(
      (student) =>
        !selectedStudents.some(
          (sel, i) => i !== index && sel.student === student.name
        )
    );
  };

  const handleSubmit = async () => {
    try {
      // Save previous overall teacher points (if available) to compute delta later
      const prevOverallPoints = points?.totalPoints || 0;

      const dateString = date.split("(")[1].split(")")[0];
      const chosenDate = new Date(dateString);

      const payload = {
        date: chosenDate,
        branch: studentBranch,
        students: selectedStudents.map((student) => ({
          name: student.student,
          grade: student.selectedGrade,
          board: student.selectedBoard,
        })),
        subjects: [
          {
            name: subject,
            chapters: [
              {
                chapterName,
                notes,
                date: new Date(),
                kSheet: kSheetGiven.toLowerCase(),
                chapterCompletion: chapterCompletion.replace("%", ""),
              },
            ],
          },
        ],
      };

      const response = await api.post("/daily-updates", payload);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(
          response.data.message || "Failed to create daily update"
        );
      }
      console.log("Full response data:", response.data);
      let updatedPointsInfo = response.data.pointsInfo;
      const dailyUpdateId = response.data.dailyUpdate._id;

      // If a file upload is required, wait for it then re-fetch teacher points.
      if (selectedFile && kSheetGiven === "yes" && dailyUpdateId) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("dailyUpdateId", dailyUpdateId);
        formData.append("subjectName", subject);
        formData.append("chapterName", chapterName);
        formData.append("branch", studentBranch);
        formData.append("fileType", "k-sheet");

        const uploadResponse = await api.post(
          "/daily-updates/upload-ksheet",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (uploadResponse.status !== 200) {
          throw new Error("Failed to upload K-sheet to Nextcloud");
        }
        console.log("K-Sheet uploaded successfully to Nextcloud");
        console.log(
          "Nextcloud URL saved in MongoDB:",
          uploadResponse.data.fileUrl
        );
        // Re-fetch teacher points after file upload
        const pointsResponse = await api.get("/teacher-points");
        updatedPointsInfo = pointsResponse.data;
      }

      if (updatedPointsInfo) {
        setPointsEarned(updatedPointsInfo);
        setPointsDialogOpen(true);
        playCoinSound();
        fetchPoints();
        // Compute the reward for this update as the difference between the new overall points and the previous overall points.
        const rewardPoints = updatedPointsInfo.totalPoints - prevOverallPoints;
        // Delay the reward toast to avoid overlapping notifications.
        setTimeout(() => {
          showPointsToast(rewardPoints, "daily update reward");
        }, 500);
      }

      toast.success("Daily update submitted successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form state
      setSelectedStudents([{ student: "", selectedGrade: "", selectedBoard: "" }]);
      setSubject("");
      setChapterName("");
      setNotes("");
      setStudentBranch("");
      setKSheetGiven("no");
      setChapterCompletion("0%");
      setSelectedFile(null);
      setUploadedFile(null);
    } catch (error) {
      console.error("Error submitting daily update:", error);
      toast.error(`Failed to submit daily update: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Maximum size is 10MB.");
        setSelectedFile(null);
        setUploadedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadedFile(file);
    }
  };

  if (studentsLoading || subjectsLoading) return <div>Loading...</div>;

  return (
    <>
      <MainFrame>
        <Box
          sx={{
            width: "fit-content",
            minWidth: "70%",
            p: 2,
            position: "relative",
            left: "50%",
            transform: "translateX(-50%)",
            border: "1px solid #d3d3d3",
            borderRadius: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IoMdCheckmarkCircleOutline size={32} color="#0000eb" />
            <Typography variant="h6" component="h6" sx={{ color: "#1a237e", fontWeight: 600 }}>
              Daily Update Form
            </Typography>
          </Box>

          <Box component="form" sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {selectedStudents.map((student, index) => (
                <Box
                  key={index}
                  sx={{
                    gap: 1,
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #d3d3d3",
                    borderRadius: "8px",
                    p: 2,
                    pt: 1,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body1" component="p">
                      Student {index + 1}*
                    </Typography>
                    {selectedStudents.length > 1 && (
                      <IconButton onClick={() => deleteStudentField(index)} sx={{ color: "red" }}>
                        <Close />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                    <Autocomplete
                      fullWidth
                      options={getAvailableStudents(index)}
                      getOptionLabel={(option) => option.name}
                      value={allStudentsList.find((s) => s.name === student.student) || null}
                      onChange={(event, newValue) =>
                        handleStudentChange(index, newValue ? newValue.name : "")
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Select or search student..." required />
                      )}
                    />
                    {student.student && (
                      <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 1, justifyContent: "space-evenly" }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" component="p" sx={{ mb: 0.5 }}>
                            Grade
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: "#f9f9f9",
                              p: 1.5,
                              border: "1px solid #d3d3d3",
                              borderRadius: "4px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {student.selectedGrade}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" component="p" sx={{ mb: 0.5 }}>
                            Board
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: "#f9f9f9",
                              p: 1.5,
                              border: "1px solid #d3d3d3",
                              borderRadius: "4px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {student.selectedBoard}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}

              <Button variant="outlined" onClick={addStudentField} sx={{ mt: 2, alignSelf: "flex-start" }}>
                + Add another student
              </Button>

              <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 1, justifyContent: "space-evenly" }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="subject-label">Subject</InputLabel>
                    <Select labelId="subject-label" value={subject} label="Subject *" onChange={(e) => setSubject(e.target.value)}>
                      {listAllSubject?.map((subj, index) => (
                        <MenuItem key={index} value={subj}>
                          {subj}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Branch</InputLabel>
                    <Select value={studentBranch} label="Branch" onChange={(e) => setStudentBranch(e.target.value)}>
                      {branches?.map((branch) => (
                        <MenuItem key={branch._id} value={branch.name}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body1" component="label" htmlFor="chapter-name">
                  Chapter Name *
                </Typography>
                <TextField id="chapter-name" fullWidth value={chapterName} onChange={(e) => setChapterName(e.target.value)} required />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body1" component="label" htmlFor="notes">
                  Notes *
                </Typography>
                <TextareaAutosize
                  id="notes"
                  minRows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  style={{
                    border: "1px solid #d3d3d3",
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body1" component="label" htmlFor="date">
                  Date
                </Typography>
                <Select id="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)}>
                  <MenuItem value={todayOption}>{todayOption}</MenuItem>
                  <MenuItem value={yesterdayOption}>{yesterdayOption}</MenuItem>
                </Select>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
                <Typography variant="body1" component="label">
                  K-Sheet Given
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box
                    onClick={() => setKSheetGiven("no")}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      border: kSheetGiven === "no" ? "2px solid #ffcc00" : "2px solid #f5f5f5",
                      borderRadius: "8px",
                      bgcolor: kSheetGiven === "no" ? "#fffdaf" : "#f5f5f5",
                      cursor: "pointer",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: kSheetGiven === "no" ? "#ffcc00" : "white",
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        border: kSheetGiven === "no" ? "2px solid #ffcc00" : "2px solid #e0e0e0",
                      }}
                    >
                      <FiX size={24} color={kSheetGiven === "no" ? "white" : "#e0e0e0"} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: kSheetGiven === "no" ? "#ffcc00" : "#444444" }}>
                      No
                    </Typography>
                  </Box>
                  <Box
                    onClick={() => setKSheetGiven("textual")}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      border: kSheetGiven === "textual" ? "2px solid #ffcc00" : "2px solid #f5f5f5",
                      borderRadius: "8px",
                      bgcolor: kSheetGiven === "textual" ? "#fffdaf" : "#f5f5f5",
                      cursor: "pointer",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: kSheetGiven === "textual" ? "#ffcc00" : "white",
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        border: kSheetGiven === "textual" ? "2px solid #ffcc00" : "2px solid #e0e0e0",
                      }}
                    >
                      <FiFileText size={24} color={kSheetGiven === "textual" ? "white" : "#e0e0e0"} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: kSheetGiven === "textual" ? "#ffcc00" : "#444444" }}>
                      Textual
                    </Typography>
                  </Box>
                  <Box
                    onClick={() => setKSheetGiven("yes")}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      border: kSheetGiven === "yes" ? "2px solid #ffcc00" : "2px solid #f5f5f5",
                      borderRadius: "8px",
                      bgcolor: kSheetGiven === "yes" ? "#fffdaf" : "#f8f8f8",
                      cursor: "pointer",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: kSheetGiven === "yes" ? "#ffcc00" : "white",
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        border: kSheetGiven === "yes" ? "2px solid #ffcc00" : "2px solid #e0e0e0",
                      }}
                    >
                      <FiCheck size={24} color={kSheetGiven === "yes" ? "white" : "#e0e0e0"} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: kSheetGiven === "yes" ? "#ffcc00" : "#444444" }}>
                      Yes
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {kSheetGiven === "yes" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" component="p" sx={{ mb: 1 }}>
                    Upload K-Sheet
                  </Typography>
                  <Box
                    sx={{
                      border: "1px dashed #d3d3d3",
                      borderRadius: "8px",
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      height: "100px",
                      width: "50%",
                      position: "relative",
                      left: "50%",
                      transform: "translateX(-50%)",
                      "&:hover": { border: "1px dashed #ffcc00" },
                    }}
                  >
                    <Box
                      component="label"
                      htmlFor="upload-ksheet"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                      }}
                    >
                      <input
                        id="upload-ksheet"
                        type="file"
                        accept=".doc,.docx,.pdf,.jpeg,.jpg,.png"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                        {uploadedFile ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#4CAF50" />
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 16L12 8" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 11L12 8 15 11" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ color: "#ffcc00", fontWeight: "medium", textAlign: "center" }}>
                        {uploadedFile ? uploadedFile.name : "Upload a file"}
                      </Typography>
                      {!uploadedFile && (
                        <Typography variant="caption" sx={{ color: "#9e9e9e", textAlign: "center", mt: 0.5 }}>
                          DOC, DOCX, PDF, JPEG, PNG up to 10MB
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
                <Typography variant="body1" component="label">
                  Chapter Completion
                </Typography>
                <Box sx={{ justifyContent: "space-around", display: "flex" }}>
                  <Box onClick={() => setChapterCompletion("25%")} sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: chapterCompletion === "25%" ? "#4a6bdf" : "#e0e0e0",
                        color: chapterCompletion === "25%" ? "white" : "black",
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      25%
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: chapterCompletion === "25%" ? "#4a6bdf" : "inherit" }}>
                      Started
                    </Typography>
                  </Box>
                  <Box onClick={() => setChapterCompletion("50%")} sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: chapterCompletion === "50%" ? "#4a6bdf" : "#e0e0e0",
                        color: chapterCompletion === "50%" ? "white" : "black",
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      50%
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: chapterCompletion === "50%" ? "#4a6bdf" : "inherit" }}>
                      Halfway
                    </Typography>
                  </Box>
                  <Box onClick={() => setChapterCompletion("75%")} sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: chapterCompletion === "75%" ? "#4a6bdf" : "#e0e0e0",
                        color: chapterCompletion === "75%" ? "white" : "black",
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      75%
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: chapterCompletion === "75%" ? "#4a6bdf" : "inherit" }}>
                      Almost Done
                    </Typography>
                  </Box>
                  <Box onClick={() => setChapterCompletion("100%")} sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: chapterCompletion === "100%" ? "#4a6bdf" : "#e0e0e0",
                        color: chapterCompletion === "100%" ? "white" : "black",
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      100%
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: chapterCompletion === "100%" ? "#4a6bdf" : "inherit" }}>
                      Complete
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{
                  mt: 3,
                  bgcolor: "#ffcc00",
                  color: "white",
                  "&:hover": { bgcolor: "#e6b800" },
                  py: 1.5,
                  fontWeight: "bold",
                }}
                startIcon={<IoMdCheckmarkCircleOutline />}
                fullWidth
              >
                Submit Update
              </Button>
            </Box>
          </Box>
        </Box>
      </MainFrame>
      <ToastContainer />
    </>
  );
};

export default DailyUpdates;
