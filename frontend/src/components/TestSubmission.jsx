import React, { useState, useContext, useEffect } from "react";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { BsUpload } from "react-icons/bs";
import { IoMdCheckmarkCircleOutline, IoMdDocument } from "react-icons/io";
import { FiFilter } from "react-icons/fi";
import { Close } from "@mui/icons-material";
import MainFrame from "./ui/MainFrame";
import api from "../api";
import { StudentsContext } from "../context/StudentContext";
import { InfoContext } from "../context/InfoContext";
import { SubjectsContext } from "../context/SubjectsContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useTeacherPoints from "../hooks/useMyTeacherPoints";

const TestSubmission = () => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Date formatting functions
  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatSubmissionDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Today's date for submission
  const today = new Date();
  const todayFormatted = formatDate(today);

  // Form state for test submission
  const [submissionDate] = useState(todayFormatted);
  const [proposedTestDate, setProposedTestDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [subject, setSubject] = useState("");
  const [listAllSubject, setListAllSubject] = useState([]);
  const [chapters, setChapters] = useState([{ chapterName: "" }]);
  const [notes, setNotes] = useState("");
  const [branch, setBranch] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Selected students state
  const [selectedStudents, setSelectedStudents] = useState([{ name: "", grade: "" }]);

  // Test submissions and pagination states
  const [testSubmissions, setTestSubmissions] = useState([]);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [displayedSubmissions, setDisplayedSubmissions] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [pageSizeOptions, setPageSizeOptions] = useState([]);

  // Filter states
  const [studentFilter, setStudentFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // "", "today", "tomorrow"
  const [showFilters, setShowFilters] = useState(false);

  // Contexts for students, subjects, branches
  const { students, loading: studentsLoading } = useContext(StudentsContext);
  const { subjects, loading: subjectsLoading } = useContext(SubjectsContext);
  const { branches } = useContext(InfoContext);

  // Teacher points hook for reward logic
  const { points, fetchPoints, playCoinSound, showPointsToast } = useTeacherPoints();

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dynamically set possible page-size options
  useEffect(() => {
    const newPageSizeOptions = Array.from(
      { length: Math.ceil(displayedSubmissions.length / 5) },
      (_, i) => (i + 1) * 5
    );
    setPageSizeOptions(newPageSizeOptions);
    if (!newPageSizeOptions.includes(pageSize)) {
      setPageSize(newPageSizeOptions[newPageSizeOptions.length - 1] || 5);
    }
    const maxPage = Math.ceil(displayedSubmissions.length / pageSize);
    if (page >= maxPage) {
      setPage(maxPage > 0 ? maxPage - 1 : 0);
    }
  }, [displayedSubmissions.length, pageSize, page]);

  // Fetch test submissions from backend
  const fetchTestSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const response = await api.get("/test-submissions");
      setTestSubmissions(response.data);
      setSubmissionsError(null);
    } catch (err) {
      console.error("Error fetching test submissions:", err);
      setSubmissionsError("Failed to load test submissions. Please try again later.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchTestSubmissions();
  }, []);

  // Role-based filtering for submissions (base filter)
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userRole");
    if (userRole === "superadmin" || userRole === "admin") {
      setFilteredSubmissions(testSubmissions);
    } else if (userRole === "teacher" && storedEmail) {
      const filtered = testSubmissions.filter(
        (submission) => submission.email === storedEmail
      );
      setFilteredSubmissions(filtered);
    }
  }, [testSubmissions]);

  // Apply user-entered filters to produce displayedSubmissions
  useEffect(() => {
    let newSubmissions = [...filteredSubmissions];

    // Student filter
    if (studentFilter.trim() !== "") {
      newSubmissions = newSubmissions.filter((submission) =>
        submission.students?.some((st) =>
          st.name.toLowerCase().includes(studentFilter.toLowerCase())
        )
      );
    }
    // Subject filter
    if (subjectFilter.trim() !== "") {
      newSubmissions = newSubmissions.filter((submission) =>
        submission.subject?.name?.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }
    // Branch filter
    if (branchFilter.trim() !== "") {
      newSubmissions = newSubmissions.filter((submission) =>
        submission.branch?.toLowerCase().includes(branchFilter.toLowerCase())
      );
    }
    // Date filter
    if (dateFilter === "today") {
      const todayDate = new Date();
      newSubmissions = newSubmissions.filter((submission) => {
        const subDate = new Date(submission.proposedDate);
        return subDate.toDateString() === todayDate.toDateString();
      });
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      newSubmissions = newSubmissions.filter((submission) => {
        const subDate = new Date(submission.proposedDate);
        return subDate.toDateString() === tomorrow.toDateString();
      });
    }

    setDisplayedSubmissions(newSubmissions);
    setPage(0);
  }, [filteredSubmissions, studentFilter, subjectFilter, branchFilter, dateFilter]);

  // Reset filter states
  const handleResetFilters = () => {
    setStudentFilter("");
    setSubjectFilter("");
    setBranchFilter("");
    setDateFilter("");
  };

  // Handlers for student fields
  const handleAddStudent = () => {
    setSelectedStudents([...selectedStudents, { name: "", grade: "" }]);
  };

  const handleRemoveStudent = (index) => {
    const updatedStudents = [...selectedStudents];
    updatedStudents.splice(index, 1);
    setSelectedStudents(updatedStudents);
  };

  const handleStudentChange = (index, newValue) => {
    const updatedStudents = [...selectedStudents];
    const selectedStudent = students?.find((s) => s.studentName === newValue?.studentName);

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

    if (newValue) {
      updatedStudents[index] = {
        name: newValue.name,
        grade: newValue.grade,
      };
    } else {
      updatedStudents[index] = { name: "", grade: "" };
    }
    setSelectedStudents(updatedStudents);
  };

  const handleGradeChange = (index, value) => {
    const updatedStudents = [...selectedStudents];
    updatedStudents[index].grade = value;
    setSelectedStudents(updatedStudents);
  };

  // Handlers for chapter fields
  const handleAddChapter = () => {
    setChapters([...chapters, { chapterName: "" }]);
  };

  const handleRemoveChapter = (index) => {
    const updatedChapters = [...chapters];
    updatedChapters.splice(index, 1);
    setChapters(updatedChapters);
  };

  const handleChapterChange = (index, value) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].chapterName = value;
    setChapters(updatedChapters);
  };

  // File Upload Handler
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Maximum size is 10MB.");
        setSelectedFile(null);
        return;
      }
      console.log("File selected:", file.name);
      setSelectedFile(file);
    }
  };

  // Handle form submission for test submission along with file upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Save previous overall teacher points for reward computation
    const prevOverallPoints = points?.totalPoints || 0;

    const formDataPayload = {
      proposedDate: new Date(proposedTestDate).toISOString(),
      branch: branch,
      totalMarks: parseInt(totalMarks),
      students: selectedStudents,
      subject: {
        name: subject,
        chapters: chapters,
        notes: notes || "",
      },
    };

    console.log("Sending test submission data to backend:", formDataPayload);

    try {
      // Create test submission record
      const response = await api.post("/test-submissions", formDataPayload);
      const testSubmissionId = response.data.testSubmission._id;
      console.log("Test submission created with ID:", testSubmissionId);
      console.log("Selected file:", selectedFile);

      // If a file is selected, upload it
      if (selectedFile && testSubmissionId) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);
        uploadFormData.append("testSubmissionId", testSubmissionId);
        uploadFormData.append("subjectName", subject);
        uploadFormData.append("chapterName", chapters[0] ? chapters[0].chapterName : "Unknown Chapter");
        uploadFormData.append("fileType", "test-sheet");

        const uploadResponse = await api.post("/test-submissions/upload-testfile", uploadFormData);
        if (uploadResponse.status !== 200) {
          throw new Error("Failed to upload test file to Nextcloud");
        }
        console.log("Test file uploaded successfully to Nextcloud");
        console.log("Nextcloud URL saved in MongoDB:", uploadResponse.data.fileUrl);
      } else {
        console.log("No file selected; skipping file upload.");
      }

      // Re-fetch teacher points after submission & file upload
      const pointsResponse = await api.get("/teacher-points");
      const updatedPointsInfo = pointsResponse.data;
      const rewardPoints = updatedPointsInfo.totalPoints - prevOverallPoints;
      playCoinSound();
      fetchPoints();

      // Wait for 300ms, then show reward toast & success
      setTimeout(() => {
        showPointsToast(rewardPoints, "test submission reward");
        toast.success("Test submission created successfully!");
      }, 300);

      // Reset form fields
      setProposedTestDate("");
      setTotalMarks("");
      setSubject("");
      setChapters([{ chapterName: "" }]);
      setNotes("");
      setSelectedStudents([{ name: "", grade: "" }]);
      setSelectedFile(null);

      // Refresh test submissions list
      fetchTestSubmissions();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.response?.data?.message || "Failed to submit test"}`);
    }
  };

  if (studentsLoading || subjectsLoading) return <div>Loading...</div>;

  return (
    <MainFrame>
      {/* Test Submission Form */}
      <Box
        sx={{
          p: 3,
          width: { xs: "100%", sm: "90%", md: "80%", lg: "70%" },
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          border: "1px solid #ccc",
          borderRadius: "8px",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IoMdCheckmarkCircleOutline size={32} color="#0000eb" />
          <Typography variant="h6" component="h6" sx={{ color: "#1a237e", fontWeight: 600 }}>
            Test Submission Form
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Submission Date */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
              <Typography variant="body1" component="label">
                Submission Date
              </Typography>
              <TextField size={isMobile ? "small" : "medium"} fullWidth value={submissionDate} readOnly />
            </Box>

            {/* Proposed Test Date & Branch */}
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2 
            }}>
              <Box sx={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                gap: 1,
                mb: { xs: 1, sm: 0 }
              }}>
                <Typography variant="body1" component="label" required>
                  Proposed Test Date <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  type="date"
                  value={proposedTestDate}
                  onChange={(e) => setProposedTestDate(e.target.value)}
                  required
                />
              </Box>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body1" component="label" required>
                  Branch <span style={{ color: "red" }}>*</span>
                </Typography>
                <Select
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Branch
                  </MenuItem>
                  {branches?.map((b) => (
                    <MenuItem key={b._id} value={b.name}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {/* Total Marks */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body1" component="label" required>
                Total Marks (20-140) <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size={isMobile ? "small" : "medium"}
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                type="number"
                inputProps={{ min: 1 }}
                required
              />
            </Box>

            {/* Students */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1" component="label" required>
                  Students <span style={{ color: "red" }}>*</span>
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddStudent}
                  startIcon={<span>+</span>}
                  size="small"
                  sx={{ bgcolor: "#4285F4", color: "white", "&:hover": { bgcolor: "#3367d6" } }}
                >
                  Add Student
                </Button>
              </Box>
              {selectedStudents.map((student, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: "flex", 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2, 
                    alignItems: { xs: 'stretch', sm: 'center' },
                    mb: { xs: 2, sm: 0 }
                  }}
                >
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      student.name
                        ? students.find((s) => s.name === student.name) || null
                        : null
                    }
                    onChange={(event, newValue) => handleStudentChange(index, newValue)}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select or search student..." fullWidth size={isMobile ? "small" : "medium"} required />
                    )}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    placeholder="Grade"
                    value={student.grade}
                    onChange={(e) => handleGradeChange(index, e.target.value)}
                    sx={{ 
                      width: { xs: '100%', sm: '100px' }
                    }}
                    size={isMobile ? "small" : "medium"}
                    required
                  />
                  {selectedStudents.length > 1 && (
                    <IconButton 
                      onClick={() => handleRemoveStudent(index)}
                      sx={{
                        alignSelf: { xs: 'flex-end', sm: 'center' },
                        mt: { xs: -1, sm: 0 }
                      }}
                    >
                      <Close />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            {/* Subject */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body1" component="label" required>
                Subject <span style={{ color: "red" }}>*</span>
              </Typography>
              <Autocomplete
                options={listAllSubject.map((subj) => ({ name: subj }))}
                getOptionLabel={(option) => option.name}
                value={
                  listAllSubject.includes(subject) ? { name: subject } : null
                }
                onChange={(event, newValue) => setSubject(newValue ? newValue.name : "")}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select Subject" required />
                )}
                noOptionsText="No records found"
                fullWidth
                size={isMobile ? "small" : "medium"}
              />
            </Box>

            {/* Chapters */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1" component="label" required>
                  Chapters <span style={{ color: "red" }}>*</span>
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddChapter}
                  startIcon={<span>+</span>}
                  size="small"
                  sx={{ bgcolor: "#4285F4", color: "white", "&:hover": { bgcolor: "#3367d6" } }}
                >
                  Add Chapter
                </Button>
              </Box>
              {chapters.map((chapter, index) => (
                <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    placeholder="Enter chapter name"
                    value={chapter.chapterName}
                    onChange={(e) => handleChapterChange(index, e.target.value)}
                    required
                  />
                  {chapters.length > 1 && (
                    <IconButton onClick={() => handleRemoveChapter(index)}>
                      <Close />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            {/* Notes */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body1" component="label">
                Notes
              </Typography>
              <TextField
                fullWidth
                size={isMobile ? "small" : "medium"}
                multiline
                rows={4}
                placeholder="Enter notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>

            {/* File Upload Section */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body1" component="label">
                Upload Test File
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<BsUpload />}
                sx={{
                  width: "fit-content",
                  borderColor: "#e0e0e0",
                  color: "#333",
                  textTransform: "none",
                  "&:hover": { borderColor: "#4285F4" },
                }}
              >
                {selectedFile ? "Change File" : "Upload File"}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  File selected: {selectedFile.name}
                </Typography>
              )}
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: "#ffcc00",
                  color: "white",
                  py: 1.5,
                  fontWeight: "bold",
                  "&:hover": { bgcolor: "#e6b800" },
                }}
              >
                Submit Test
              </Button>
            </Box>
          </Box>
        </form>
      </Box>

      {/* Test Correction Details Section */}
      <Box
        sx={{
          p: { xs: 0, sm: 3 },
          width: { xs: "100%", sm: "90%", md: "80%", lg: "70%" },
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)",
          mb: 4,
        }}
      >
        {/* Heading + Filters Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IoMdDocument size={28} color="#1a237e" />
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                color: "#1a237e", 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Test Correction Details
            </Typography>
          </Box>
          <Button
            variant="outlined"
            component="button"
            startIcon={<FiFilter size={24} color="#1a237e"/>}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              textTransform: "none", 
              color: "#1a237e",
              minWidth: { xs: 'auto', sm: '64px' },
              px: { xs: 1, sm: 2 }
            }}
          >
            <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
              Filters
            </Typography>
          </Button>
        </Box>

        {/* Filter Bar */}
        {showFilters && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              backgroundColor: "#fff",
              p: 2,
              borderRadius: "8px",
              mb: 2,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              label="Student"
              placeholder="Filter by student"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <TextField
              variant="outlined"
              size="small"
              label="Subject"
              placeholder="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <TextField
              variant="outlined"
              size="small"
              label="Branch"
              placeholder="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Date"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="tomorrow">Tomorrow</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ textTransform: "none" }}>
              Reset Filters
            </Button>
          </Box>
        )}

        {/* Submissions Display */}
        {loadingSubmissions ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "150px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : submissionsError ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="error" variant="body1">
              {submissionsError}
            </Typography>
          </Box>
        ) : displayedSubmissions.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              border: "1px solid #eee",
              borderRadius: "8px",
            }}
          >
            <Typography variant="body1">No test submissions found.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/** 
             * IMPORTANT: Use "displayedSubmissions" instead of "filteredSubmissions" 
             * so that user filters actually apply in the UI. 
             */}
            {displayedSubmissions
              .slice()
              .reverse()
              .slice(page * pageSize, page * pageSize + pageSize)
              .map((submission, index) => (
                <Card key={index} sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <CardContent sx={{ p: 3, position: "relative" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Teacher Name(s)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission?.teacherName || "N/A"}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Student Name(s)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission.students?.map((student) => student.name).join(", ") || "N/A"}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Chapter Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission.subject?.chapters?.map((chapter) => chapter.chapterName).join(", ") || "N/A"}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Test File Location
                        </Typography>
                        {submission.subject?.uploadTestFileUrl ? (
                          <Typography
                            component="a"
                            href={submission.subject.uploadTestFileUrl}
                            variant="body1"
                            sx={{
                              color: "#1976d2",
                              textDecoration: "none",
                              fontWeight: 500,
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            Click here to view
                          </Typography>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            No file uploaded
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Subject
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission.subject?.name || "N/A"}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Branch
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission.branch || "N/A"}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Marks
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                          {submission.totalMarks || "N/A"}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ position: "absolute", bottom: 12, right: 16 }}
                    >
                      Submitted on: {formatSubmissionDate(submission.submissionDate)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            <TablePagination
              component="div"
              count={displayedSubmissions.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={pageSizeOptions}
              sx={{
                ".MuiTablePagination-select": {
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                },
                ".MuiTablePagination-selectIcon": {
                  color: "#666",
                },
                ".MuiTablePagination-displayedRows": {
                  margin: { xs: "0 auto", sm: 0 },
                },
                ".MuiTablePagination-actions": {
                  marginLeft: { xs: 0, sm: 2 },
                },
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                ".MuiToolbar-root": {
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  justifyContent: "center",
                  padding: { xs: 1, sm: 2 },
                },
              }}
            />
          </Box>
        )}
      </Box>
      <ToastContainer />
    </MainFrame>
  );
};

export default TestSubmission;