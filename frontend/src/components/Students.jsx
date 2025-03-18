import { LuClipboard } from "react-icons/lu";
import React, { useEffect, useState, useCallback, useContext } from "react";
import dayjs from "dayjs";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import MainFrame from "./ui/MainFrame";
import { FiSave } from "react-icons/fi";
import { BsUpload } from "react-icons/bs";

import api from "../api";
import { SubjectsContext } from "../context/SubjectsContext";
import { InfoContext } from "../context/InfoContext";

import { PDFDownloadLink } from "@react-pdf/renderer";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InvoicePDF from "../pdf/InvoicePDF";

const Students = () => {
  const { subjects } = useContext(SubjectsContext);
  const { grades, boards, branches } = useContext(InfoContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Student basic info states
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("Playschool");
  const [studentBranch, setStudentBranch] = useState("Goregoan West");
  const [studentBoard, setStudentBoard] = useState("IGCSE");
  const [schoolName, setSchoolName] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState("Admission Due");
  const [photoPreview, setPhotoPreview] = useState(null);

  // Fee settings state
  const [gstEnabled, setGstEnabled] = useState(false);
  const [scholarshipEnabled, setScholarshipEnabled] = useState(false);
  const [scholarshipPercent, setScholarshipPercent] = useState(10);
  const [oneToOneEnabled, setOneToOneEnabled] = useState(false);
  const [oneToOnePercent, setOneToOnePercent] = useState(10);
  const [showUSD, setShowUSD] = useState(false);
  const [usdRate, setUsdRate] = useState(null);

  // Custom total amount state
  const [customTotalAmount, setCustomTotalAmount] = useState("");

  // Subjects state – each subject now has its own start and end dates
  const [selectedSubjects, setSelectedSubjects] = useState([
    { subject: "", startDate: null, endDate: null },
  ]);

  // Phone numbers state (for contacts/parents)
  const [phoneNumbers, setPhoneNumbers] = useState([
    {
      id: 1,
      number: "",
      relation: "",
      name: "",
      educationQualification: "",
      organization: "",
      designation: "",
      department: "",
      // We'll store the uploaded URL in photoPreview and the file in photoFile
      photoPreview: null,
      photoFile: null,
    },
  ]);

  // Fee breakdown state
  const [feeBreakdown, setFeeBreakdown] = useState(null);

  // Student photo state (stores file for later upload)
  const [studentPhoto, setStudentPhoto] = useState(null);

  // --- File Upload Function ---
  // Upload file returns a URL pointing to the uploads folder.
  const uploadFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const response = await api.post("/upload/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        const fileName = response.data.fileName;
        const directUrl = `https://drive.inkstall.us/remote.php/webdav/uploads/${encodeURIComponent(
          fileName
        )}`;
        return directUrl;
      } else {
        console.error("Upload failed:", response.data.message);
        return null;
      }
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // --- Toggle Handlers ---
  const handleScholarshipToggle = (enabled) => {
    setScholarshipEnabled(enabled);
    if (enabled) setScholarshipPercent(10);
  };
  const handleOneToOneToggle = (enabled) => {
    setOneToOneEnabled(enabled);
    if (enabled) setOneToOnePercent(10);
  };

  // --- Phone Numbers Handlers ---
  const handleAddPhoneNumber = () => {
    setPhoneNumbers([
      ...phoneNumbers,
      {
        id: phoneNumbers.length + 1,
        number: "",
        relation: "",
        name: "",
        educationQualification: "",
        organization: "",
        designation: "",
        department: "",
        photoPreview: null,
        photoFile: null,
      },
    ]);
  };
  const handleRemovePhoneNumber = (id) => {
    setPhoneNumbers(phoneNumbers.filter((phone) => phone.id !== id));
  };
  const handlePhoneNumberChange = (id, field, value) => {
    setPhoneNumbers(
      phoneNumbers.map((phone) =>
        phone.id === id ? { ...phone, [field]: value } : phone
      )
    );
  };

  // --- Parent (Contact) Photo Change Handler ---
  // This function validates and creates a preview without uploading.
  const handleContactPhotoChange = (id, event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file for contact");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPhoneNumbers(
      phoneNumbers.map((phone) =>
        phone.id === id
          ? { ...phone, photoPreview: objectUrl, photoFile: file }
          : phone
      )
    );
  };

  // --- Subjects Handlers ---
  const handleAddSubject = () => {
    setSelectedSubjects([
      ...selectedSubjects,
      { subject: "", startDate: null, endDate: null },
    ]);
  };
  const handleRemoveSubject = useCallback((index) => {
    setSelectedSubjects(prevSubjects => {
      const newSubjects = prevSubjects.filter((_, i) => i !== index);
      // Ensure we always have at least one subject field
      if (newSubjects.length === 0) {
        return [{ subject: "", startDate: null, endDate: null }];
      }
      return newSubjects;
    });
    
    // Reset fee breakdown to trigger recalculation
    setFeeBreakdown(null);
    
    // Reset custom total amount when subjects change
    setCustomTotalAmount("");
  }, []);
  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...selectedSubjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSelectedSubjects(newSubjects);
  };

  // --- USD Rate ---
  useEffect(() => {
    if (showUSD && !usdRate) {
      fetch("https://api.exchangerate-api.com/v4/latest/USD")
        .then((response) => response.json())
        .then((data) => {
          const rate = data.rates.INR;
          setUsdRate(rate * 1.03);
        })
        .catch((error) => {
          console.error("Error fetching USD rate:", error);
          setShowUSD(false);
        });
    }
  }, [showUSD, usdRate]);

  // --- Currency Formatter ---
  const formatAmount = (amount) => {
    if (showUSD && usdRate) {
      const usdAmount = (amount / usdRate).toFixed(2);
      return `$${usdAmount}`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // --- Fee Calculation Integration ---
  const calculateInstallments = (totalAmount, startDate) => {
    let installmentCount = 1;
    
    // Determine number of installments based on total amount
    if (totalAmount >= 80000) {
      installmentCount = 3;
    } else if (totalAmount >= 40000) {
      installmentCount = 2;
    }
    
    const installmentAmount = Math.round(totalAmount / installmentCount);
    const remainingAmount = totalAmount - installmentAmount * (installmentCount - 1);
    
    // Use today's date for the first installment
    const today = new Date();
    const installments = [];
    
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(today);
      // First installment is today, subsequent installments are monthly
      if (i > 0) {
        dueDate.setMonth(today.getMonth() + i);
      }
      
      installments.push({
        pay: i === installmentCount - 1 ? remainingAmount : installmentAmount,
        paid: 0, // Amount actually paid (initially 0)
        dueDate: dueDate.toISOString().split("T")[0],
        paidDate: null // Initially no payment date
      });
    }
    return installments;
  };

  const integratedCalculateFees = useCallback(() => {
    let baseRate;
    if (studentBranch === "Online") {
      baseRate = 1500;
    } else {
      switch (studentBoard) {
        case "IGCSE": baseRate = 1200; break;
        case "IB": baseRate = 2500; break;
        case "NIOS": baseRate = 3000; break;
        case "CBSE":
        case "SSC": baseRate = 800; break;
        default: baseRate = 800;
      }
    }
    let gradeMultiplier = 1;
    const earlyGrades = ["Playschool", "Nurserry", "Jr. KG", "Sr. KG", "1"];
    if (!earlyGrades.includes(studentGrade)) {
      const gradeNum = parseInt(studentGrade);
      if (!isNaN(gradeNum) && gradeNum > 1) {
        gradeMultiplier = Math.pow(1.1, gradeNum - 1);
      }
    }
    const baseMonthlyRate = baseRate * gradeMultiplier;
    let subtotal = 0;
    const subjectFees = [];
    selectedSubjects.forEach((subject) => {
      if (subject.startDate && subject.endDate && subject.subject) {
        const days = dayjs(subject.endDate).diff(dayjs(subject.startDate), "days") + 1;
        let monthlyRate = baseMonthlyRate;
        if (oneToOneEnabled) {
          monthlyRate = baseMonthlyRate * (1 + oneToOnePercent / 100);
        }
        const dailyRate = monthlyRate / 30;
        const subjectFee = dailyRate * days;
        subjectFees.push({ subject: subject.subject, fee: Math.round(subjectFee) });
        subtotal += subjectFee;
      }
    });
    subtotal = Math.round(subtotal);
    const subjectDiscountPercentage = selectedSubjects.length >= 3 ? 10 : 0;
    const subjectDiscountAmount = Math.round(subtotal * (subjectDiscountPercentage / 100));
    const scholarshipDiscountPercentage = scholarshipEnabled ? scholarshipPercent : 0;
    const scholarshipDiscountAmount = Math.round(subtotal * (scholarshipDiscountPercentage / 100));
    const baseAmount = subtotal - subjectDiscountAmount - scholarshipDiscountAmount;
    const gstAmount = gstEnabled ? Math.round(baseAmount * 0.18) : 0;
    let finalTotal = baseAmount + gstAmount;
    let installmentStartDate = new Date();
    const validDates = selectedSubjects.filter((s) => s.startDate).map((s) => new Date(s.startDate));
    if (validDates.length > 0) installmentStartDate = new Date(Math.min(...validDates));
    let installments = calculateInstallments(finalTotal, installmentStartDate);

    let breakdown = {
      subjectFees,
      subtotal,
      subjectDiscount: { percentage: subjectDiscountPercentage, amount: subjectDiscountAmount },
      scholarshipDiscount: { percentage: scholarshipDiscountPercentage, amount: scholarshipDiscountAmount },
      baseAmount,
      gstAmount,
      finalTotal,
      installments,
    };

    if (customTotalAmount && !isNaN(customTotalAmount)) {
      const customTotal = parseFloat(customTotalAmount);
      if (customTotal > 0) {
        const subjectCount = breakdown.subjectFees.length || 1;
        const share = Math.round(customTotal / subjectCount);
        breakdown.subjectFees = breakdown.subjectFees.map((s) => ({ subject: s.subject, fee: share }));
        breakdown.subtotal = customTotal;
        breakdown.subjectDiscount = { percentage: 0, amount: 0 };
        breakdown.scholarshipDiscount = { percentage: 0, amount: 0 };
        breakdown.baseAmount = customTotal;
        breakdown.gstAmount = 0;
        breakdown.finalTotal = customTotal;
        breakdown.installments = calculateInstallments(customTotal, installmentStartDate);
      }
    }
    return breakdown;
  }, [
    selectedSubjects,
    studentBoard,
    studentBranch,
    studentGrade,
    oneToOneEnabled,
    oneToOnePercent,
    gstEnabled,
    scholarshipEnabled,
    scholarshipPercent,
    customTotalAmount,
  ]);

  useEffect(() => {
    const fees = integratedCalculateFees();
    setFeeBreakdown(fees);
  }, [integratedCalculateFees]);

  // --- Student Photo Handler ---
  // Validate and create preview without uploading.
  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setStudentPhoto(file);
  };

  const computeSubjectFee = (subjectItem) => {
    if (subjectItem.startDate && subjectItem.endDate && subjectItem.subject) {
      let baseRate;
      if (studentBranch === "Online") {
        baseRate = 1500;
      } else {
        switch (studentBoard) {
          case "IGCSE": baseRate = 1200; break;
          case "IB": baseRate = 2500; break;
          case "NIOS": baseRate = 3000; break;
          case "CBSE":
          case "SSC": baseRate = 800; break;
          default: baseRate = 800;
        }
      }
      let gradeMultiplier = 1;
      const earlyGrades = ["Playschool", "Nurserry", "Jr. KG", "Sr. KG", "1"];
      if (!earlyGrades.includes(studentGrade)) {
        const gradeNum = parseInt(studentGrade);
        if (!isNaN(gradeNum) && gradeNum > 1) {
          gradeMultiplier = Math.pow(1.1, gradeNum - 1);
        }
      }
      const baseMonthlyRate = baseRate * gradeMultiplier;
      let monthlyRate = baseMonthlyRate;
      if (oneToOneEnabled) {
        monthlyRate = baseMonthlyRate * (1 + oneToOnePercent / 100);
      }
      const dailyRate = monthlyRate / 30;
      const days = dayjs(subjectItem.endDate).diff(dayjs(subjectItem.startDate), "days") + 1;
      const subjectFee = dailyRate * days;
      return Math.round(subjectFee);
    }
    return 0;
  };

  // --- Save Handler ---
  const handleSaveStudent = async () => {
    // Validate required fields
    if (!studentName || !studentGrade || !studentBranch || !schoolName || !studentBoard || !academicYear) {
      alert("Please fill in all required student details");
      return;
    }

    // Validate at least one contact is added with required fields
    if (phoneNumbers.length === 0) {
      alert("Please add at least one contact");
      return;
    }

    // Check if each contact has required fields
    const hasValidContact = phoneNumbers.some(contact => 
      contact.number && contact.name && contact.relation
    );
    
    if (!hasValidContact) {
      alert("Please ensure at least one contact has name, phone number, and relation filled");
      return;
    }

    if (
      !area ||
      !landmark ||
      !city ||
      !state ||
      !pincode
    ) {
      alert("Please fill in all address fields");
      return;
    }

    for (const contact of phoneNumbers) {
      if (
        !contact.number ||
        !contact.relation ||
        !contact.name ||
        !contact.educationQualification ||
        !contact.organization ||
        !contact.designation ||
        !contact.department
      ) {
        alert("Please fill in all contact information fields");
        return;
      }
    }

    const preparedSubjects = selectedSubjects.map((s, index) => ({
      name: s.subject,
      total:
        customTotalAmount && feeBreakdown && feeBreakdown.subjectFees[index]
          ? feeBreakdown.subjectFees[index].fee
          : computeSubjectFee(s),
      startDate: s.startDate ? new Date(s.startDate) : new Date(),
      endDate: s.endDate
        ? new Date(s.endDate)
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    }));

    // Process parent/contact photos: for each contact, if a photoFile exists, upload it.
    const preparedContacts = [];
    for (const phone of phoneNumbers) {
      let parentPhotoUrl = phone.photoPreview;
      if (phone.photoFile && phone.photoFile instanceof File) {
        const uploadedUrl = await uploadFile(phone.photoFile);
        if (uploadedUrl) {
          parentPhotoUrl = uploadedUrl;
        }
      }
      preparedContacts.push({
        number: phone.number,
        relation: phone.relation.toLowerCase(),
        relationName: phone.name,
        educationQualification: phone.educationQualification,
        nameOfOrganisation: phone.organization,
        designation: phone.designation,
        Department: phone.department,
        parentPhotoUrl: parentPhotoUrl || null,
      });
    }

    const feeConfig = {
      basePrice: feeBreakdown?.subtotal || 0,
      gstApplied: gstEnabled,
      gstPercentage: gstEnabled ? 18 : 0,
      gstAmount: feeBreakdown?.gstAmount || 0,
      scholarshipApplied: scholarshipEnabled,
      scholarshipPercentage: scholarshipEnabled ? scholarshipPercent : 0,
      scholarshipAmount: feeBreakdown?.scholarshipDiscount?.amount || 0,
      oneToOneApplied: oneToOneEnabled,
      oneToOnePercentage: oneToOneEnabled ? oneToOnePercent : 0,
      oneToOneAmount: oneToOneEnabled
        ? Math.round((feeBreakdown?.subtotal || 0) * (oneToOnePercent / 100))
        : 0,
      baseAmount: feeBreakdown?.baseAmount || 0,
      totalAmount: feeBreakdown?.finalTotal || 0,
    };

    const statusMap = {
      "Admission Due": "admissiondue",
      Active: "active",
      Inactive: "inactive",
    };
    const studentStatus = statusMap[status] || "admissiondue";

    // Process student photo: upload if it's a File.
    let studentPhotoUrl = null;
    if (studentPhoto && studentPhoto instanceof File) {
      studentPhotoUrl = await uploadFile(studentPhoto);
    } else if (typeof studentPhoto === "string") {
      studentPhotoUrl = studentPhoto;
    }

    const studentData = {
      studentName,
      grade: studentGrade,
      branch: studentBranch,
      board: studentBoard?.toUpperCase(),
      school: schoolName,
      academicYear,
      address: { area, landmark, city, state, pincode },
      status: studentStatus,
      contactInformation: preparedContacts,
      feeConfig,
      studentPhotoUrl: studentPhotoUrl || null,
      subjects: preparedSubjects,
      feesInstallment: feeBreakdown?.installments.map(installment => ({
        pay: installment.pay || installment.amount, // Use pay if available, fallback to amount
        paid: installment.paid || 0, // Amount actually paid (initially 0)
        dueDate: new Date(installment.dueDate), // Convert string date to Date object
        paidDate: null // Initially no payment date
      })) || []
    };

    console.log("Saving student data:", studentData);
    try {
      const response = await api.post("/students", studentData);
      console.log("API Response:", response.data); // Log the API response
      if (response.data.success) {
        alert("Student saved successfully!");
        // Reset form or redirect as needed.
      } else {
        alert("Error saving student: " + response.data.message);
      }
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error saving student: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <MainFrame sx={{ p: 3 }}>
     {/* Header with action buttons */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3, md: 4 }, 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2 
      }}>
        <Typography
          variant="h6"
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            fontWeight: "bold", 
            color: "#1a237e",
            mb: { xs: 1, sm: 0 },
            fontSize: { xs: "1rem", sm: "1.25rem" }
          }}
        >
          <AddIcon /> Add New Students
        </Typography>
        <Box sx={{ flex: { xs: 0, sm: 1 } }} />
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" },
          width: { xs: "100%", sm: "auto" },
          gap: 1
        }}>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            sx={{ 
              bgcolor: "#4a90e2", 
              color: "#964b00", 
              borderRadius: "8px",
              fontSize: { xs: "0.75rem", sm: "0.875rem" }
            }}
          >
            Download Template
          </Button>
          <Button 
            variant="contained" 
            startIcon={<UploadIcon />} 
            sx={{ 
              bgcolor: "#fecc00", 
              color: "#964b00", 
              borderRadius: "8px",
              fontSize: { xs: "0.75rem", sm: "0.875rem" }
            }}
          >
            Upload Excel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            sx={{ 
              bgcolor: "#fecc00", 
              color: "#964b00", 
              borderRadius: "8px",
              fontSize: { xs: "0.75rem", sm: "0.875rem" }
            }}
          >
            Add Manually
          </Button>
        </Box>
      </Box>

      <Grid container spacing={0}>
        {/* Student Details Section */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: "1px solid #ccc",borderRadius: 1, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1a237e", fontWeight: 600 }}>
              Student Details
            </Typography>
            {/* Student Photo */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Student Photo
              </Typography>
              <Box sx={{ display: "flex" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Student Photo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", backgroundColor: "#eee" }}
                    >
                      <BsUpload sx={{ fontSize: 40 }} />
                    </Box>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                  />
                </Box>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField 
                label="Student Name"                     
                size={isMobile ? "small" : "medium"}
                fullWidth 
                required 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl size={isMobile ? "small" : "medium"} fullWidth required>
                  <InputLabel>Grade</InputLabel>
                  <Select value={studentGrade} label="Grade" onChange={(e) => setStudentGrade(e.target.value)}>
                    {grades.map((grade) => (
                      <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl size={isMobile ? "small" : "medium"} fullWidth required>
                  <InputLabel>Branch</InputLabel>
                  <Select value={studentBranch} label="Branch" onChange={(e) => setStudentBranch(e.target.value)}>
                    {branches.map((branch) => (
                      <MenuItem key={branch._id} value={branch.name}>{branch.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="School Name" fullWidth size={isMobile ? "small" : "medium"} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"} required>
                  <InputLabel>Board</InputLabel>
                  <Select value={studentBoard} label="Board" onChange={(e) => setStudentBoard(e.target.value)}>
                    {boards.map((board) => (
                      <MenuItem key={board._id} value={board.name}>{board.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"} required>
                  <InputLabel>Academic Year</InputLabel>
                  <Select value={academicYear} label="Academic Year" onChange={(e) => setAcademicYear(e.target.value)}>
                    {["2024-2025", "2025-2026"].map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"} required>
                  <InputLabel>Status</InputLabel>
                  <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                    {["Admission Due", "Active", "Inactive"].map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Address Details Section */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1a237e", fontWeight: 600 }}>
              Address Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Area" fullWidth size={isMobile ? "small" : "medium"} value={area} onChange={(e) => setArea(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Landmark" fullWidth size={isMobile ? "small" : "medium"} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="City" fullWidth size={isMobile ? "small" : "medium"} value={city} onChange={(e) => setCity(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="State" fullWidth size={isMobile ? "small" : "medium"} value={state} onChange={(e) => setState(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Pincode" fullWidth size={isMobile ? "small" : "medium"} value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Contact Information Section */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
              <Typography variant="h6" sx={{ color: "#1a237e", fontWeight: 600 }}>
                Contact Information
              </Typography>
              <Button variant="text" startIcon={<AddIcon />} size="small" sx={{ color: "primary.main" }} onClick={handleAddPhoneNumber}>
                Add Contact
              </Button>
            </Box>

            {phoneNumbers.map((phone) => (
              <Grid container spacing={2} key={phone.id} sx={{ ml: 0, mb: 4, p: 2, border: "1px solid #ccc", borderRadius: 2, width: "100%" }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone Number (with country code)"
                    required
                    value={phone.number}
                    onChange={(e) => handlePhoneNumberChange(phone.id, "number", e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Contact Person's Name"
                    required
                    value={phone.name}
                    onChange={(e) => handlePhoneNumberChange(phone.id, "name", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Relation</InputLabel>
                    <Select
                      value={phone.relation}
                      label="Relation"
                      onChange={(e) => handlePhoneNumberChange(phone.id, "relation", e.target.value)}
                      size="small"
                    >
                      {["Father", "Mother", "Guardian"].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={1} container alignItems="center">
                  {phoneNumbers.length > 1 && (
                    <IconButton size="small" onClick={() => handleRemovePhoneNumber(phone.id)} sx={{ color: "error.main" }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>

                {phone.relation && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: "text.secondary" }}>
                        Additional Information for {phone.relation}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Education Qualification"
                        value={phone.educationQualification || ""}
                        onChange={(e) => handlePhoneNumberChange(phone.id, "educationQualification", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name of Organisation"
                        value={phone.organization || ""}
                        onChange={(e) => handlePhoneNumberChange(phone.id, "organization", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Designation"
                        value={phone.designation || ""}
                        onChange={(e) => handlePhoneNumberChange(phone.id, "designation", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Department"
                        value={phone.department || ""}
                        onChange={(e) => handlePhoneNumberChange(phone.id, "department", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                        {phone.relation}'s Photo
                      </Typography>
                      <Box sx={{ display: "flex" }}>
                        <Box
                          sx={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            overflow: "hidden",
                          }}
                        >
                          {phone.photoPreview ? (
                            <img
                              src={phone.photoPreview}
                              alt="Contact Photo"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Box
                              sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", backgroundColor: "#ccc" }}
                            >
                              <BsUpload style={{ fontSize: 24 }} />
                            </Box>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleContactPhotoChange(phone.id, e)}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            ))}
          </Box>
        </Grid>

        {/* Subjects Section */}
        <Grid item xs={12}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #ccc", borderRadius: 1, mb: 3 }}>
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between", 
              alignItems: { xs: "flex-start", sm: "center" }, 
              mb: 2,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography variant="h6" sx={{ 
                color: "#1a237e", 
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}>
                Subjects
              </Typography>
              <Button 
                variant="text" 
                startIcon={<AddIcon />} 
                size="small" 
                sx={{ color: "primary.main" }} 
                onClick={handleAddSubject}
              >
                Add Subject
              </Button>
            </Box>

            {selectedSubjects.map((subjectItem, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: "flex", 
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 }, 
                  alignItems: { xs: "flex-start", sm: "center" }, 
                  mb: { xs: 3, sm: 2 },
                  pb: { xs: 2, sm: 0 },
                  borderBottom: { xs: index !== selectedSubjects.length - 1 ? "1px dashed #e0e0e0" : "none", sm: "none" }
                }}
              >
                <Box sx={{ width: { xs: "100%", sm: "40%" } }}>
                  <FormControl size={isMobile ? "small" : "medium"} sx={{ width: "100%" }} required>
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={subjectItem.subject}
                      label="Subject"
                      onChange={(e) => handleSubjectChange(index, "subject", e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      {subjects
                        .filter((s) => !selectedSubjects.some((sel, i) => sel.subject === s.name && i !== index))
                        .map((s) => (
                          <MenuItem key={s.name} value={s.name}>
                            {s.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ 
                  width: { xs: "100%", sm: "25%" }, 
                  display: "flex", 
                  justifyContent: { xs: "flex-start", sm: "center" }
                }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start Date"
                    value={subjectItem.startDate}
                    onChange={(value) => handleSubjectChange(index, "startDate", value)}
                    slotProps={{
                      textField: {
                        size: isMobile ? "small" : "medium",
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
                </Box>
                <Box sx={{ width: { xs: "100%", sm: "25%" } }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={subjectItem.endDate}
                    onChange={(value) => handleSubjectChange(index, "endDate", value)}
                    slotProps={{
                      textField: {
                        size: isMobile ? "small" : "medium",
                        fullWidth: true,
                        required: true
                      }
                    }}
                    minDate={subjectItem.startDate || dayjs()}
                    disabled={!subjectItem.startDate}
                  />
                </LocalizationProvider>
                </Box>
                <Box sx={{ 
                  width: { xs: "100%", sm: "fit-content" },
                  display: "flex",
                  justifyContent: { xs: "flex-end", sm: "center" }
                }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveSubject(index)} 
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Fee Settings Section */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#1a237e", fontWeight: 600 }}>Fee Settings</Typography>
              {/* PDF Download Button */}
              {feeBreakdown && selectedSubjects.some(s => s.subject && s.startDate && s.endDate) && (
                <PDFDownloadLink 
                  document={
                    <InvoicePDF 
                      student={{
                        name: studentName || "",
                        grade: studentGrade || "",
                        board: studentBoard || "",
                        email: phoneNumbers[0]?.number || "",
                        phone: phoneNumbers[0]?.number || ""
                      }}
                      subjects={selectedSubjects
                        .filter(s => s.subject && s.startDate && s.endDate)
                        .map(s => ({
                          ...s,
                          subject: s.subject || "",
                          startDate: s.startDate ? dayjs(s.startDate).format('DD/MM/YYYY') : null,
                          endDate: s.endDate ? dayjs(s.endDate).format('DD/MM/YYYY') : null
                        }))}
                      feeBreakdown={feeBreakdown}
                      installment={feeBreakdown?.installments || []}
                      showUSD={showUSD}
                      usdRate={usdRate}
                    />
                  } 
                  fileName={`${studentName || 'Student'}_Details_${dayjs().format('DDMMYYYY')}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ blob, url, loading, error }) => (
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      sx={{ 
                        bgcolor: "rgb(37 99 235)", 
                        color: "#fff", 
                        borderRadius: "8px",
                        '&:hover': {
                          bgcolor: "rgb(29 78 216)"
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? "Generating PDF..." : error ? "Error" : "Download PDF"}

                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "space-between" }}>
              <FormControlLabel
                control={<Switch size="medium" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} />}
                label={<Typography variant="body2">GST</Typography>}
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FormControlLabel
                  control={<Switch size="medium" checked={scholarshipEnabled} onChange={(e) => handleScholarshipToggle(e.target.checked)} />}
                  label={<Typography variant="body2">Scholarship</Typography>}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
                />
                {scholarshipEnabled && (
                  <Select value={scholarshipPercent} onChange={(e) => setScholarshipPercent(e.target.value)} sx={{ minWidth: 80, height: isMobile ? 32 : 40 }} size={isMobile ? "small" : "medium"}>
                    {[10, 20, 30, 40, 50].map((percent) => (
                      <MenuItem key={percent} value={percent}>{percent}%</MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FormControlLabel
                  control={<Switch size="medium" checked={oneToOneEnabled} onChange={(e) => handleOneToOneToggle(e.target.checked)} />}
                  label={<Typography variant="body2">1:1</Typography>}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
                />
                {oneToOneEnabled && (
                  <Select value={oneToOnePercent} onChange={(e) => setOneToOnePercent(e.target.value)} sx={{ minWidth: 80, height: isMobile ? 32 : 40 }} size={isMobile ? "small" : "medium"}>
                    {Array.from({ length: 20 }, (_, i) => (i + 1) * 10).map((percent) => (
                      <MenuItem key={percent} value={percent}>{percent}%</MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
              <FormControlLabel
                control={<Switch size="medium" checked={showUSD} onChange={(e) => setShowUSD(e.target.checked)} />}
                label={<Typography variant="body2">$</Typography>}
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Custom Total Amount"
                type="number"
                size="small"
                value={customTotalAmount}
                onChange={(e) => setCustomTotalAmount(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{showUSD && usdRate ? "$" : "₹"}</InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Enter a custom total amount to adjust subject fees proportionally.
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Fee Details Section */}
        {feeBreakdown && (
          <Grid item xs={12}>
            <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#1a237e", fontWeight: 600 }}>Fee Details</Typography>
              {feeBreakdown.subjectFees.map((item, index) => (
                <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">{item.subject}</Typography>
                  <Typography variant="body2">{formatAmount(item.fee)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">{formatAmount(feeBreakdown.subtotal)}</Typography>
              </Box>
              {feeBreakdown.subjectDiscount.amount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">
                    Multi-subject Discount ({feeBreakdown.subjectDiscount.percentage}%)
                  </Typography>
                  <Typography variant="body2" color="error">
                    -{formatAmount(feeBreakdown.subjectDiscount.amount)}
                  </Typography>
                </Box>
              )}
              {feeBreakdown.scholarshipDiscount.amount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">
                    Scholarship ({feeBreakdown.scholarshipDiscount.percentage}%)
                  </Typography>
                  <Typography variant="body2" color="error">
                    -{formatAmount(feeBreakdown.scholarshipDiscount.amount)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Base Amount</Typography>
                <Typography variant="body2">{formatAmount(feeBreakdown.baseAmount)}</Typography>
              </Box>
              {gstEnabled && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">GST (18%)</Typography>
                  <Typography variant="body2">{formatAmount(feeBreakdown.gstAmount)}</Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "2px solid #e0e0e0" }}>
                <Typography variant="subtitle2">Final Total</Typography>
                <Typography variant="subtitle2">{formatAmount(feeBreakdown.finalTotal)}</Typography>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Installment Details Section */}
        {feeBreakdown && (
          <Grid item xs={12}>
            <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#1a237e", fontWeight: 600 }}>
                Installment Details
              </Typography>
              
              {feeBreakdown.installments.map((installment, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    mb: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "#ffffff",
                    border: "1px solid #e0e0e0"
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      Installment {index + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {new Date(installment.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {formatAmount(installment.pay)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        )}

        {/* Save Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={handleSaveStudent}
            sx={{ mt: 2, backgroundColor: "#fecc00", color: "#964b00", gap: 1 }}
          >
            <FiSave /> Save Student
          </Button>
        </Grid>
      </Grid>
    </MainFrame>
  );
};

export default Students;