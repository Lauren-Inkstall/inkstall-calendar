import React, { useEffect, useState, useContext } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Chip, Box, Typography, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle, IconButton, CircularProgress,
  Menu, MenuItem, ListItemIcon, ListItemText, TextField, Select, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, AttachMoney, CheckCircle, PauseCircle, HourglassEmpty, FilterList, Close } from '@mui/icons-material';
import { FaEllipsisH } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import api from "../api";
import MainFrame from './ui/MainFrame';
import { StudentsContext } from '../context/StudentContext';
import { InfoContext } from '../context/InfoContext';
import { SubjectsContext } from '../context/SubjectsContext';
import EditStudentModal from './EditStudentModal';
import EditFeeModal from './EditFeeModal';
import { Filter } from 'lucide-react';
import { MdCurrencyRupee } from "react-icons/md";

function StudentsDatabase() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    studentName: "",
    status: "",
    subject: ""
  });
  const [uniqueStatuses, setUniqueStatuses] = useState([]);
  const { students: contextStudents, loading: contextLoading } = useContext(StudentsContext);
  const { grades, boards, branches } = useContext(InfoContext);
  const { subjects } = useContext(SubjectsContext);

  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    feesDueNextMonth: 0,
    dueThisMonth: 0,
    highPerformingBranch: '',
    highPerformingBranchRevenue: 0,
    onlineRevenue: 0,
    recentJoins: 0,
    admissionPending: 0,
    fiscalYearTotal: 0
  });

  const [feesDueByBranch, setFeesDueByBranch] = useState([]);
  const [showFeesDueModal, setShowFeesDueModal] = useState(false);
  const [feesDueThisMonthByBranch, setFeesDueThisMonthByBranch] = useState([]);
  const [showFeesDueThisMonthModal, setShowFeesDueThisMonthModal] = useState(false);
  const [recentJoinsByBranch, setRecentJoinsByBranch] = useState([]);
  const [showRecentJoinsModal, setShowRecentJoinsModal] = useState(false);
  const [admissionPendingByBranch, setAdmissionPendingByBranch] = useState([]);
  const [showAdmissionPendingModal, setShowAdmissionPendingModal] = useState(false);

  const calculateDashboardData = (students) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Determine current fiscal year (April to March)
    const currentFiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const nextFiscalYear = currentFiscalYear + 1;

    const data = {
      totalStudents: students.length,
      feesDueNextMonth: 0,
      dueThisMonth: 0,
      highPerformingBranch: 'N/A',
      highPerformingBranchRevenue: 0,
      onlineRevenue: 0,
      recentJoins: 0,
      admissionPending: 0,
      fiscalYearTotal: 0
    };

    // Calculate date 3 months ago
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Track branch revenue in the last 3 months
    const branchRevenueLastThreeMonths = {};
    let highestRevenueLastThreeMonths = 0;

    // Track overall branch revenue (for backup calculation)
    const branchRevenue = {};
    let highestRevenue = 0;

    students.forEach(student => {
      // Calculate admission pending
      if (student.status === 'admissiondue') {
        data.admissionPending++;
      }

      // Calculate recent joins - using the actual timestamp
      const createdAt = new Date(student.createdAt);
      if (createdAt >= thirtyDaysAgo) {
        data.recentJoins++;
      }

      // Track branch revenue
      if (student.branch) {
        // Track overall branch revenue (as backup)
        const branchTotal = student.feeConfig?.totalAmount || 0;
        branchRevenue[student.branch] = (branchRevenue[student.branch] || 0) + branchTotal;
        
        if (branchRevenue[student.branch] > highestRevenue) {
          highestRevenue = branchRevenue[student.branch];
        }
      }

      // Process fee installments
      if (Array.isArray(student.feesInstallment)) {
        student.feesInstallment.forEach(installment => {
          if (!installment.dueDate) return;
          
          const dueDate = new Date(installment.dueDate);
          const dueMonth = dueDate.getMonth();
          const dueYear = dueDate.getFullYear();
          
          // Check if this is for the current fiscal year (dynamic calculation)
          const isFiscalYear = (dueYear === currentFiscalYear && dueMonth >= 3) || 
                              (dueYear === nextFiscalYear && dueMonth <= 2);
          
          if (isFiscalYear) {
            // For fiscal year total, add the full installment amount regardless of payment status
            // This represents the total fees due for the fiscal year
            data.fiscalYearTotal += installment.pay || 0;
          }
          
          // Track branch performance in last 3 months (based on paid installments)
          if (installment.paidDate && installment.paid > 0 && student.branch) {
            const paidDate = new Date(installment.paidDate);
            
            // Check if payment was made in the last 3 months
            if (paidDate >= threeMonthsAgo) {
              branchRevenueLastThreeMonths[student.branch] = 
                (branchRevenueLastThreeMonths[student.branch] || 0) + installment.paid;
                
              // Update high performing branch if this branch has higher revenue
              if (branchRevenueLastThreeMonths[student.branch] > highestRevenueLastThreeMonths) {
                highestRevenueLastThreeMonths = branchRevenueLastThreeMonths[student.branch];
                data.highPerformingBranch = student.branch;
                data.highPerformingBranchRevenue = highestRevenueLastThreeMonths;
              }
            }
          }
          
          // An installment is considered paid if it has a paid amount > 0 and a paid date
          const isPaid = (installment.paid > 0 && installment.paidDate);
          
          // Check if due this month - only include unpaid installments
          if (dueMonth === currentMonth && dueYear === currentYear) {
            if (!isPaid) {
              // For unpaid installments, add the remaining amount (original amount minus any partial payments)
              const remainingAmount = Math.max(0, (installment.pay || 0) - (installment.paid || 0));
              data.dueThisMonth += remainingAmount;
            }
          }
          
          // Check if due next month - include ALL installments due next month regardless of payment status
          const nextMonth = (currentMonth + 1) % 12;
          const nextMonthYear = nextMonth === 0 ? currentYear + 1 : currentYear;
          
          if (dueMonth === nextMonth && dueYear === nextMonthYear) {
            // Add the full installment amount for next month, not just the remaining
            data.feesDueNextMonth += installment.pay || 0;
          }
          
          // Track online payments made this month
          if (installment.paidDate && 
              (installment.paymentType === 'upi' || 
               installment.paymentType === 'card' || 
               installment.paymentType === 'bank_transfer' || 
               installment.paymentType === 'online')) {
            const paidDate = new Date(installment.paidDate);
            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
              data.onlineRevenue += installment.paid || 0;
            }
          }
        });
      }
    });

    return data;
  };

  useEffect(() => {
    if (!contextLoading && contextStudents.length > 0) {
      // Apply filters to students before calculating dashboard data
      const studentsToUse = applyFilters(contextStudents);
      setDashboardData(calculateDashboardData(studentsToUse));
      setFilteredStudents(studentsToUse);
    }
  }, [contextLoading, contextStudents, filters]);

  useEffect(() => {
    if (!contextLoading && contextStudents.length > 0) {
      setStudents(contextStudents);
      setLoading(false);
    } else {
      fetchStudents();
    }
  }, [contextLoading, contextStudents]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStudents(response.data.students || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFeeClick = (student) => {
    // First check the local students array for the most up-to-date data
    const localStudent = students.find(s => s.studentId === student.studentId || s._id === student._id);
    
    // If not found in local state, check the context
    const contextStudent = contextStudents.find(s => s.studentId === student.studentId || s._id === student._id);
    
    // Use the most up-to-date version, prioritizing local state over context
    setCurrentStudent(localStudent || contextStudent || student);
    setShowFeeModal(true);
  };

  const handleEditClick = (student) => {
    // First check the local students array for the most up-to-date data
    const localStudent = students.find(s => s.studentId === student.studentId || s._id === student._id);
    
    // If not found in local state, check the context
    const contextStudent = contextStudents.find(s => s.studentId === student.studentId || s._id === student._id);
    
    // Use the most up-to-date version, prioritizing local state over context
    setCurrentStudent(localStudent || contextStudent || student);
    setShowEditModal(true);
  };

  const handleStatusMenuOpen = (event, student) => {
    event.stopPropagation();
    setCurrentStudent(student);
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      // Get the most up-to-date student data
      const currentStudentData = students.find(s => s._id === currentStudent._id) || currentStudent;
      
      // Ensure all required fields are present according to the schema
      // For contactInformation, ensure each contact has all required fields
      let contactInformation = currentStudentData.contactInformation || [];
      if (!Array.isArray(contactInformation) || contactInformation.length === 0) {
        // Create a default contact if none exists
        contactInformation = [{
          number: 'N/A',
          relation: 'guardian',
          relationName: 'N/A',
          educationQualification: 'N/A',
          nameOfOrganisation: 'N/A',
          designation: 'N/A',
          Department: 'N/A',
          parentPhotoUrl: null
        }];
      } else {
        // Ensure each contact has all required fields
        contactInformation = contactInformation.map(contact => ({
          number: contact.number || 'N/A',
          relation: contact.relation || 'guardian',
          relationName: contact.relationName || 'N/A',
          educationQualification: contact.educationQualification || 'N/A',
          nameOfOrganisation: contact.nameOfOrganisation || 'N/A',
          designation: contact.designation || 'N/A',
          Department: contact.Department || 'N/A',
          parentPhotoUrl: contact.parentPhotoUrl || null
        }));
      }
      
      // Ensure address has all required fields
      const address = currentStudentData.address || {};
      const validAddress = {
        area: address.area || 'N/A',
        landmark: address.landmark || 'N/A',
        city: address.city || 'N/A',
        state: address.state || 'N/A',
        pincode: address.pincode || 'N/A'
      };
      
      // Ensure feeConfig has all required fields
      const feeConfig = currentStudentData.feeConfig || {};
      const validFeeConfig = {
        basePrice: feeConfig.basePrice || 0,
        gstApplied: feeConfig.gstApplied || false,
        gstPercentage: feeConfig.gstPercentage || 0,
        gstAmount: feeConfig.gstAmount || 0,
        scholarshipApplied: feeConfig.scholarshipApplied || false,
        scholarshipPercentage: feeConfig.scholarshipPercentage || 0,
        scholarshipAmount: feeConfig.scholarshipAmount || 0,
        oneToOneApplied: feeConfig.oneToOneApplied || false,
        oneToOnePercentage: feeConfig.oneToOnePercentage || 0,
        oneToOneAmount: feeConfig.oneToOneAmount || 0,
        baseAmount: feeConfig.baseAmount || 0,
        totalAmount: feeConfig.totalAmount || 0
      };
      
      // Create the updated student data with all required fields
      const updatedStudentData = {
        _id: currentStudentData._id,
        studentId: currentStudentData.studentId || 'N/A',
        studentName: currentStudentData.studentName || currentStudentData.name || 'N/A',
        grade: currentStudentData.grade || 'N/A',
        branch: currentStudentData.branch || 'N/A',
        school: currentStudentData.school || 'N/A',
        academicYear: currentStudentData.academicYear || 'N/A',
        board: currentStudentData.board || 'N/A',
        status: newStatus,
        address: validAddress,
        contactInformation: contactInformation,
        feeConfig: validFeeConfig,
        subjects: currentStudentData.subjects || []
      };

      console.log('Updating student status to:', newStatus);
      console.log('Sending updated student data:', updatedStudentData);
      
      const response = await api.put(`/students/${currentStudentData._id}`, updatedStudentData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update the student locally instead of fetching all students again
      if (response.data.success) {
        const updatedStudent = response.data.student || {
          ...currentStudentData,
          status: newStatus
        };
        
        console.log('Successfully updated student status:', updatedStudent);
        
        // Update the student in the local state
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student._id === currentStudentData._id ? updatedStudent : student
          )
        );
      } else {
        console.warn('API returned success: false, falling back to fetchStudents');
        // If the API doesn't return the updated student, fallback to fetching all students
        fetchStudents();
      }
      
      // Close the menu
      handleStatusMenuClose();
    } catch (err) {
      console.error('Error updating student status:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(`Error updating status: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError('Error updating status: No response received from server');
      } else {
        setError(`Error updating status: ${err.message}`);
      }
      
      handleStatusMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/students/${currentStudent._id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Refresh student list
      fetchStudents();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(`Error deleting student: ${err.message}`);
    }
  };

  const applyFilters = (studentsToFilter) => {
    return studentsToFilter.filter(student => {
      // Filter by student name
      const nameMatch = !filters.studentName || 
        student.studentName?.toLowerCase().includes(filters.studentName.toLowerCase());
      
      // Filter by status
      const statusMatch = !filters.status || student.status === filters.status;
      
      // Filter by subject
      const subjectMatch = !filters.subject || 
        (student.subjects && student.subjects.some(s => s.toLowerCase().includes(filters.subject.toLowerCase())));
      
      return nameMatch && statusMatch && subjectMatch;
    });
  };

  const updateLocalStateAndDashboard = (updatedStudentData) => {
    // Update the student in the local state
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student._id === updatedStudentData._id ? updatedStudentData : student
      )
    );
    
    // Update the filtered students list to reflect changes immediately
    setFilteredStudents(prevFiltered => 
      prevFiltered.map(student => 
        student._id === updatedStudentData._id ? updatedStudentData : student
      )
    );
    
    // Recalculate dashboard data with the updated student
    if (!contextLoading && contextStudents.length > 0) {
      // Create a new array with the updated student
      const updatedContextStudents = contextStudents.map(student => 
        student._id === updatedStudentData._id ? updatedStudentData : student
      );
      
      // Apply filters to the updated students
      const studentsToUse = applyFilters(updatedContextStudents);
      
      // Update dashboard with the filtered students
      setDashboardData(calculateDashboardData(studentsToUse));
    }
  };

  const handleFeeSubmit = async (formData) => {
    console.log("handleFeeSubmit called with data:", formData);
    try {
      // Ensure we have the current student data with all required fields
      const existingStudent = currentStudent || {};
      
      // Ensure feeConfig has all required fields
      const updatedFeeConfig = {
        ...existingStudent.feeConfig,
        ...formData.feeConfig,
        // Ensure baseAmount is set (required by schema)
        baseAmount: formData.feeConfig.basePrice || existingStudent.feeConfig?.basePrice || 0
      };
      
      // Ensure all subjects have required fields
      const updatedSubjects = (formData.subjects || []).map(subject => {
        // Ensure each subject has all required fields
        return {
          name: subject.name,
          total: subject.total || 0,
          startDate: subject.startDate || new Date(),
          endDate: subject.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3))
        };
      });
      
      // Validate installments to ensure they meet requirements
      const validatedInstallments = formData.feesInstallment || existingStudent.feesInstallment || [];
      
      // Ensure installment due dates are exactly 1 month apart and handle month transitions correctly
      if (validatedInstallments.length > 1) {
        for (let i = 1; i < validatedInstallments.length; i++) {
          if (!validatedInstallments[i].dueDate) {
            const prevDate = new Date(validatedInstallments[i-1].dueDate);
            const newMonth = prevDate.getMonth() + 1;
            const newYear = prevDate.getFullYear() + (newMonth > 11 ? 1 : 0);
            const adjustedMonth = newMonth % 12;
            
            // Handle month transitions correctly (e.g., Jan 31 -> Feb 28/29)
            const day = prevDate.getDate();
            const lastDayOfMonth = new Date(newYear, adjustedMonth + 1, 0).getDate();
            const adjustedDay = Math.min(day, lastDayOfMonth);
            
            validatedInstallments[i].dueDate = new Date(newYear, adjustedMonth, adjustedDay).toISOString();
          }
        }
      }
      
      // Ensure the total of all installment amounts equals the total fee
      const totalFee = formData.feeConfig.totalAmount || 0;
      let totalPaid = 0;
      let unpaidInstallments = [];
      
      // Calculate total paid amount and identify unpaid installments
      validatedInstallments.forEach(installment => {
        // An installment is considered paid if it has a paid amount > 0 and a paid date
        const isPaid = installment.paid > 0 && installment.paidDate;
        if (isPaid) {
          totalPaid += installment.paid;
        } else {
          unpaidInstallments.push(installment);
        }
      });
      
      // Calculate remaining amount (never negative)
      const remainingAmount = Math.max(0, totalFee - totalPaid);
      
      // Distribute remaining amount equally among unpaid installments
      if (unpaidInstallments.length > 0 && remainingAmount > 0) {
        const amountPerInstallment = remainingAmount / unpaidInstallments.length;
        unpaidInstallments.forEach(installment => {
          installment.pay = amountPerInstallment;
        });
      }
      
      // Get the current student data and update with new data
      const updatedStudent = {
        ...existingStudent,
        feeConfig: updatedFeeConfig,
        subjects: updatedSubjects,
        // Include the validated feesInstallment data
        feesInstallment: validatedInstallments,
        // Update the total amount at the student level if provided
        totalAmount: formData.totalAmount || formData.feeConfig.totalAmount
      };

      console.log('Sanitized student data for update:', JSON.stringify(updatedStudent, null, 2));

      // Send the entire updated student object to the existing update endpoint
      console.log("Sending PUT request to:", `/students/${currentStudent._id}`);
      const response = await api.put(`/students/${currentStudent._id}`, updatedStudent, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log("API response:", response);
      
      if (response.data.success) {
        console.log('Student updated successfully:', response.data.student);
        
        // Get the updated student from the response or use our updated data
        const updatedStudentData = response.data.student || updatedStudent;
        
        // Update local state and dashboard
        updateLocalStateAndDashboard(updatedStudentData);
      } else {
        console.warn('API returned success: false, fetching all students');
        // If the API doesn't return the updated student, fallback to fetching all students
        fetchStudents();
      }
      
      setShowFeeModal(false);
    } catch (err) {
      console.error('Error updating student fee:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(`Error updating fee: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError(`Error updating fee: No response received from server`);
      } else {
        console.error('Error message:', err.message);
        setError(`Error updating fee: ${err.message}`);
      }
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      // Create an updated student object by merging current student with form data
      // This ensures we don't lose any fields that aren't included in the form
      const updatedStudentData = {
        ...currentStudent,
        studentName: formData.studentName,
        grade: formData.grade,
        board: formData.board,
        school: formData.school,
        status: formData.status,
        branch: formData.branch,
        academicYear: formData.academicYear,
        contactInformation: formData.contactInformation
      };

      console.log('Sending updated student data:', updatedStudentData);
      
      const response = await api.put(`/students/${currentStudent._id}`, updatedStudentData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update the student locally instead of fetching all students again
      if (response.data.success) {
        const updatedStudent = response.data.student || updatedStudentData;
        
        console.log('Successfully updated student:', updatedStudent);
        
        // Update the student in the local state
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student._id === currentStudent._id ? updatedStudent : student
          )
        );
      } else {
        console.warn('API returned success: false, falling back to fetchStudents');
        // If the API doesn't return the updated student, fallback to fetching all students
        fetchStudents();
      }
      
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating student:', err);
      setError(`Error updating student: ${err.message}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      studentName: "",
      status: "",
      subject: ""
    });
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === 'object') {
      if (value.name) return value.name;
      return JSON.stringify(value);
    }
    return value;
  };

  useEffect(() => {
    console.log('Subjects from context:', subjects);
  }, [subjects]);

  useEffect(() => {
    const uniqueStatuses = [...new Set(students.map(student => student.status || 'N/A'))];
    setUniqueStatuses(uniqueStatuses);
  }, [students]);

  const handleFeesDueClick = () => {
    // Get the dashboard data to ensure we match the total fees amount
    const dashboardData = calculateDashboardData(students);
    const expectedTotalFeesDue = dashboardData.feesDueNextMonth;
    
    // Get all available branches from the context
    const allBranches = branches || [];
    
    // Initialize fee amounts for all branches to zero
    const feesByBranch = {};
    allBranches.forEach(branch => {
      // Ensure we have a proper string representation of branch
      const branchName = typeof branch === 'object' ? 
        (branch.name || branch.toString() || 'Unknown') : String(branch);
      feesByBranch[branchName] = 0;
    });
    
    // To keep track of the total we're calculating
    let calculatedTotal = 0;
    
    // Calculate fees due next month by branch - use ALL students, not just filtered ones
    students.forEach(student => {
      if (Array.isArray(student.feesInstallment) && student.branch) {
        // Ensure we have a proper string representation of branch
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        
        // Check each installment
        student.feesInstallment.forEach(installment => {
          if (!installment.dueDate) return;
          
          const dueDate = new Date(installment.dueDate);
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const nextMonth = (currentMonth + 1) % 12;
          const nextMonthYear = nextMonth === 0 ? currentYear + 1 : currentYear;
          
          const dueMonth = dueDate.getMonth();
          const dueYear = dueDate.getFullYear();
          
          // Check if due next month - EXACTLY match the dashboard calculation logic
          // Include ALL installments due next month regardless of payment status
          if (dueMonth === nextMonth && dueYear === nextMonthYear) {
            // Add the full installment amount for next month, not just the remaining
            const amount = installment.pay || 0;
            feesByBranch[branchName] = (feesByBranch[branchName] || 0) + amount;
            calculatedTotal += amount;
          }
        });
      }
    });
    
    // Adjust the amounts if there's a difference with the expected total
    if (calculatedTotal > 0 && Math.abs(calculatedTotal - expectedTotalFeesDue) > 1) {
      const ratio = expectedTotalFeesDue / calculatedTotal;
      
      // Adjust each branch's amount proportionally
      Object.keys(feesByBranch).forEach(branch => {
        feesByBranch[branch] = Math.round(feesByBranch[branch] * ratio);
      });
    }
    
    // Convert to array for the chart, including all branches even with zero amounts
    const chartData = Object.entries(feesByBranch).map(([branch, amount]) => ({
      branch,
      amount
    }));
    
    // Sort alphabetically by branch name
    chartData.sort((a, b) => String(a.branch).localeCompare(String(b.branch)));
    
    setFeesDueByBranch(chartData);
    
    // Show the modal
    setShowFeesDueModal(true);
  };

  const handleFeesDueThisMonthClick = () => {
    // Get the dashboard data to ensure we match the total fees amount
    const dashboardData = calculateDashboardData(students);
    const expectedTotalFeesDue = dashboardData.dueThisMonth;
    
    // Get all available branches from the context
    const allBranches = branches || [];
    
    // Initialize fee amounts for all branches to zero
    const feesByBranch = {};
    allBranches.forEach(branch => {
      // Ensure we have a proper string representation of branch
      const branchName = typeof branch === 'object' ? 
        (branch.name || branch.toString() || 'Unknown') : String(branch);
      feesByBranch[branchName] = 0;
    });
    
    // To keep track of the total we're calculating
    let calculatedTotal = 0;
    
    // Calculate fees due this month by branch - use ALL students, not just filtered ones
    students.forEach(student => {
      if (Array.isArray(student.feesInstallment) && student.branch) {
        // Ensure we have a proper string representation of branch
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        
        // Check each installment
        student.feesInstallment.forEach(installment => {
          if (!installment.dueDate) return;
          
          const dueDate = new Date(installment.dueDate);
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const dueMonth = dueDate.getMonth();
          const dueYear = dueDate.getFullYear();
          
          // An installment is considered paid if it has a paid amount > 0 and a paid date
          const isPaid = (installment.paid > 0 && installment.paidDate);
          
          // Check if due this month and not paid
          if (dueMonth === currentMonth && dueYear === currentYear && !isPaid) {
            // For unpaid installments, add the remaining amount (original amount minus any partial payments)
            const remainingAmount = Math.max(0, (installment.pay || 0) - (installment.paid || 0));
            feesByBranch[branchName] = (feesByBranch[branchName] || 0) + remainingAmount;
            calculatedTotal += remainingAmount;
          }
        });
      }
    });
    
    // Adjust the amounts if there's a difference with the expected total
    if (calculatedTotal > 0 && Math.abs(calculatedTotal - expectedTotalFeesDue) > 1) {
      const ratio = expectedTotalFeesDue / calculatedTotal;
      
      // Adjust each branch's amount proportionally
      Object.keys(feesByBranch).forEach(branch => {
        feesByBranch[branch] = Math.round(feesByBranch[branch] * ratio);
      });
    }
    
    // Convert to array for the chart, including all branches even with zero amounts
    const chartData = Object.entries(feesByBranch).map(([branch, amount]) => ({
      branch,
      amount
    }));
    
    // Sort alphabetically by branch name
    chartData.sort((a, b) => String(a.branch).localeCompare(String(b.branch)));
    
    setFeesDueThisMonthByBranch(chartData);
    
    // Show the modal
    setShowFeesDueThisMonthModal(true);
  };

  const handleRecentJoinsClick = () => {
    // Get the dashboard data to ensure we match the total recent joins count
    const dashboardData = calculateDashboardData(students);
    const expectedTotalRecentJoins = dashboardData.recentJoins;
    
    // Get all available branches from the context
    const allBranches = branches || [];
    
    // Create a map of branches for easier reference
    const joinsByBranch = {};
    
    // Ensure we have a proper representation of all branches
    // First, get all branches from the context
    if (allBranches.length > 0) {
      allBranches.forEach(branch => {
        // Ensure we have a proper string representation of branch
        const branchName = typeof branch === 'object' ? 
          (branch.name || branch.toString() || 'Unknown') : String(branch);
        joinsByBranch[branchName] = 0;
      });
    }
    
    // Then also check all branches from student data to catch any missing ones
    students.forEach(student => {
      if (student.branch) {
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        if (!joinsByBranch.hasOwnProperty(branchName)) {
          joinsByBranch[branchName] = 0;
        }
      }
    });
    
    // Define the cutoff date for recent joins (30 days ago)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Calculate recent joins by branch - use ALL students, not just filtered ones
    students.forEach(student => {
      if (student.branch) {
        // Ensure we have a proper string representation of branch
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        
        // Calculate recent joins - using the actual timestamp
        const createdAt = new Date(student.createdAt);
        if (createdAt >= thirtyDaysAgo) {
          joinsByBranch[branchName] = (joinsByBranch[branchName] || 0) + 1;
        }
      }
    });
    
    // Ensure we have at least some data to display
    if (Object.keys(joinsByBranch).length === 0) {
      joinsByBranch['No Branches'] = 0;
    }
    
    // Convert to array for the chart, including all branches even with zero counts
    const chartData = Object.entries(joinsByBranch).map(([branch, count]) => ({
      branch,
      count
    }));
    
    // Sort alphabetically by branch name
    chartData.sort((a, b) => String(a.branch).localeCompare(String(b.branch)));
    
    console.log('Recent joins by branch (includes all branches):', chartData);
    
    setRecentJoinsByBranch(chartData);
    
    // Show the modal
    setShowRecentJoinsModal(true);
  };

  const handleAdmissionPendingClick = () => {
    // Get the dashboard data to ensure we match the total admission pending count
    const dashboardData = calculateDashboardData(students);
    const expectedTotalAdmissionPending = dashboardData.admissionPending;
    
    // Get all available branches from the context
    const allBranches = branches || [];
    
    // Create a map of branches for easier reference
    const admissionPendingByBranch = {};
    
    // Ensure we have a proper representation of all branches
    // First, get all branches from the context
    if (allBranches.length > 0) {
      allBranches.forEach(branch => {
        // Ensure we have a proper string representation of branch
        const branchName = typeof branch === 'object' ? 
          (branch.name || branch.toString() || 'Unknown') : String(branch);
        admissionPendingByBranch[branchName] = 0;
      });
    }
    
    // Then also check all branches from student data to catch any missing ones
    students.forEach(student => {
      if (student.branch) {
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        if (!admissionPendingByBranch.hasOwnProperty(branchName)) {
          admissionPendingByBranch[branchName] = 0;
        }
      }
    });
    
    // Calculate admission pending by branch - use ALL students, not just filtered ones
    students.forEach(student => {
      if (student.branch && student.status === 'admissiondue') {
        // Ensure we have a proper string representation of branch
        const branchName = typeof student.branch === 'object' ? 
          (student.branch.name || student.branch.toString() || 'Unknown') : String(student.branch);
        
        admissionPendingByBranch[branchName] = (admissionPendingByBranch[branchName] || 0) + 1;
      }
    });
    
    // Ensure we have at least some data to display
    if (Object.keys(admissionPendingByBranch).length === 0) {
      admissionPendingByBranch['No Branches'] = 0;
    }
    
    // Convert to array for the chart, including all branches even with zero counts
    const chartData = Object.entries(admissionPendingByBranch).map(([branch, count]) => ({
      branch,
      count
    }));
    
    // Sort alphabetically by branch name
    chartData.sort((a, b) => String(a.branch).localeCompare(String(b.branch)));
    
    console.log('Admission pending by branch (includes all branches):', chartData);
    
    setAdmissionPendingByBranch(chartData);
    
    // Show the modal
    setShowAdmissionPendingModal(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <MainFrame>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 4 }}>
        {/* Total Students */}
        <Box sx={{ p: 2, bgcolor: '#2196f3', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight="bold">Total Students</Typography>
          <Typography variant="h4" fontWeight="bold">{dashboardData.totalStudents}</Typography>
          <Typography variant="body2">Across all grades and boards</Typography>
        </Box>
        
        {/* Total Fees Due (Next Month) */}
        <Box sx={{ p: 2, bgcolor: '#4caf50', color: 'white', borderRadius: 1, cursor: 'pointer' }} onClick={handleFeesDueClick}>
          <Typography variant="h6" fontWeight="bold">Total Fees Due (Next Month)</Typography>
          <Typography variant="h4" fontWeight="bold">₹{dashboardData.feesDueNextMonth.toLocaleString()}</Typography>
          <Typography variant="body2">Expected revenue next month</Typography>
        </Box>
        
        {/* Due This Month */}
        <Box sx={{ p: 2, bgcolor: '#f44336', color: 'white', borderRadius: 1, cursor: 'pointer' }} onClick={handleFeesDueThisMonthClick}>
          <Typography variant="h6" fontWeight="bold">Due This Month</Typography>
          <Typography variant="h4" fontWeight="bold">₹{dashboardData.dueThisMonth.toLocaleString()}</Typography>
          <Typography variant="body2">Pending payments this month</Typography>
        </Box>
        
        {/* High Performing Branch */}
        <Box sx={{ p: 2, bgcolor: '#ff9800', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight="bold">High Performing Branch</Typography>
          <Typography variant="h4" fontWeight="bold">{dashboardData.highPerformingBranch}</Typography>
          <Typography variant="body2">₹{dashboardData.highPerformingBranchRevenue.toLocaleString()} in last 3 months</Typography>
        </Box>
        
        {/* Online Revenue */}
        <Box sx={{ p: 2, bgcolor: '#9c27b0', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight="bold">Online Revenue</Typography>
          <Typography variant="h4" fontWeight="bold">₹{dashboardData.onlineRevenue.toLocaleString()}</Typography>
          <Typography variant="body2">Online payments this month</Typography>
        </Box>
        
        {/* Recent Joins */}
        <Box sx={{ p: 2, bgcolor: '#009688', color: 'white', borderRadius: 1, cursor: 'pointer' }} onClick={handleRecentJoinsClick}>
          <Typography variant="h6" fontWeight="bold">Recent Joins</Typography>
          <Typography variant="h4" fontWeight="bold">{dashboardData.recentJoins}</Typography>
          <Typography variant="body2">In the last 30 days</Typography>
        </Box>
        
        {/* Admission Pending */}
        <Box sx={{ p: 2, bgcolor: '#e65100', color: 'white', borderRadius: 1, cursor: 'pointer' }} onClick={handleAdmissionPendingClick}>
          <Typography variant="h6" fontWeight="bold">Admission Pending</Typography>
          <Typography variant="h4" fontWeight="bold">{dashboardData.admissionPending}</Typography>
          <Typography variant="body2">New applications to process</Typography>
        </Box>
        
        {/* Fiscal Year Total */}
        <Box sx={{ p: 2, bgcolor: '#673ab7', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight="bold">Fiscal Year Total</Typography>
          <Typography variant="h4" fontWeight="bold">₹{dashboardData.fiscalYearTotal.toLocaleString()}</Typography>
          <Typography variant="body2">Total fees Apr 2024 - Mar 2025</Typography>
        </Box>
      </Box>

      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h2 className="text-2xl font-bold mb-6">Students Database</h2>
          <Box display="flex" alignItems="center"  onClick={() => setShowFilters(prev => !prev)} sx={{ cursor: 'pointer' }}>
            <IconButton>
              <Filter />
            </IconButton>
            <Typography>Filter</Typography>
          </Box>
        </Box>
        {showFilters && (
          <Box mb={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TextField
              label="Student Name"
              name="studentName"
              value={filters.studentName}
              onChange={handleFilterChange}
              sx={{ mr: 2, width: '30%' }}  
            />
            <TextField
              select
              label="Status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              sx={{ mr: 2, minWidth: 150, width: '25%' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="admissiondue">Admission Due</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <FormControl sx={{ mr: 2, minWidth: 200, width: '25%' }}>
              <InputLabel id="subject-select-label">Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                label="Subject"
              >
                <MenuItem value="">All Subjects</MenuItem>
                {subjects && subjects.map((subject, index) => (
                  <MenuItem key={index} value={typeof subject === 'string' ? subject : subject.name}>
                    {typeof subject === 'string' ? subject : subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={resetFilters} sx={{ width: 'fit-content' }}>Reset Filters</Button>
          </Box>
        )}
        <Table>
          <TableHead>
            <TableRow >
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Name</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">ID</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">School</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Contact Info</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Status</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Subjects</Typography></TableCell>
              <TableCell sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.studentId || student._id} hover>
                  <TableCell sx={{ textAlign: 'center' }}>{student.name || student.studentName || "N/A"}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{student.studentId || "N/A"}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{renderValue(student.school)}</TableCell>
                  <TableCell>
                    {(() => {
                      // Check for contactInformation array first
                      if (student.contactInformation && Array.isArray(student.contactInformation) && student.contactInformation.length > 0) {
                        return student.contactInformation.map((contact, index) => (
                          <Box key={index} mb={0.5} display="flex" alignItems="center" justifyContent={'center'}>
                            <Typography variant="body2">
                              {contact.number} ({contact.relation ? contact.relation.charAt(0).toUpperCase() + contact.relation.slice(1) : 'Contact'})
                            </Typography>
                          </Box>
                        ));
                      }
                      
                      // Check for phoneNumbers array
                      if (Array.isArray(student.phoneNumbers) && student.phoneNumbers.length > 0) {
                        return student.phoneNumbers.map((phone, index) => (
                          <Box key={index} mb={0.5} display="flex" alignItems="center" justifyContent={'center'}>
                            <Typography variant="body2">
                              {phone.number} ({phone.relation ? phone.relation.charAt(0).toUpperCase() + phone.relation.slice(1) : 'Contact'})
                            </Typography>
                          </Box>
                        ));
                      }
                      
                      // Check for direct contact property
                      if (student.contact) {
                        return <Typography variant="body2">{student.contact}</Typography>;
                      }
                      
                      // Check for phone property
                      if (student.phone) {
                        return <Typography variant="body2">{student.phone}</Typography>;
                      }
                      
                      // If we have a raw student object with phoneNumbers
                      if (student.phoneNumbers && typeof student.phoneNumbers === 'string') {
                        return <Typography variant="body2">{student.phoneNumbers}</Typography>;
                      }
                      
                      // Last resort - check if the student object itself has a number property
                      if (student.number) {
                        return <Typography variant="body2">{student.number}</Typography>;
                      }
                      
                      return <Typography variant="body2" color="text.secondary">No Contact Info</Typography>;
                    })()}
                  </TableCell>
                  <TableCell >
                    <Chip 
                      label={student.status || "N/A"} 
                      color={
                        student.status?.toLowerCase() === 'admission due' ? 'warning' :
                        student.status?.toLowerCase() === 'active' ? 'success' :
                        student.status?.toLowerCase() === 'inactive' ? 'error' :
                        'default'
                      }
                      size="small"
                      variant="outlined"
                      sx={{ position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ justifyContent: 'center' }}>
                      {Array.isArray(student.subjects) && student.subjects.length > 0 ? (
                        student.subjects.map((subject, index) => (
                          <Chip
                            key={index}
                            label={typeof subject === 'object' ? renderValue(subject) : subject}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        "No Subjects"
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} sx={{ textAlign: 'center', justifyContent: 'center' }}>
                      <IconButton 
                        color="success" 
                        size="small"
                        onClick={() => handleFeeClick(student)}
                      >
                        {/* <AttachMoney /> */}
                        <MdCurrencyRupee size={22} />
                      </IconButton>
                      <IconButton 
                        color="info" 
                        size="small"
                        onClick={() => handleEditClick(student)}
                      >
                        <FiEdit />
                      </IconButton>
                      <IconButton 
                        color="grey" 
                        size="small"
                        onClick={(event) => handleStatusMenuOpen(event, student)}
                      >
                        <FaEllipsisH />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="subtitle1" sx={{ py: 5 }}>
                    No students found matching the filter criteria
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </Box>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('admissiondue')}>
          <ListItemIcon>
            <HourglassEmpty fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Admission Due</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('active')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Active</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('inactive')}>
          <ListItemIcon>
            <PauseCircle fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Inactive</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Fee Modal */}
      {showFeeModal && currentStudent && (
        <EditFeeModal 
          student={currentStudent} 
          onClose={() => setShowFeeModal(false)} 
          onSubmit={handleFeeSubmit} 
        />
      )}
      
      {/* Edit Student Modal */}
      {showEditModal && currentStudent && (
        <EditStudentModal 
          student={currentStudent} 
          onClose={() => setShowEditModal(false)} 
          onSubmit={handleEditSubmit} 
        />
      )}
      
      {/* Fees Due Next Month Modal */}
      <Dialog 
        open={showFeesDueModal} 
        onClose={() => setShowFeesDueModal(false)}
        aria-labelledby="fees-due-dialog-title"
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { bgcolor: 'white' } 
        }}
        scroll="paper"
      >
        <DialogTitle id="fees-due-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Fees Due Next Month by Branch</Typography>
            <IconButton onClick={() => setShowFeesDueModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {feesDueByBranch.length > 0 ? (
            <Box sx={{ mt: 2, mb: 4 }}>
              {/* Chart container */}
              <Box sx={{ 
                height: '280px',
                width: '100%',
                position: 'relative',
                pt: 2,
                pb: 5,
                pl: 6,
                pr: 2,
              }}>
                {/* Y-axis label */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'rotate(-90deg) translateX(50%)',
                    transformOrigin: 'left center',
                    fontWeight: 'bold'
                  }}
                >
                  Fees Due (₹)
                </Typography>
                
                {/* Y-axis ticks and grid lines */}
                {(() => {
                  // Find max value for scale
                  const maxFees = Math.max(...feesDueByBranch.map(item => item.amount), 50000);
                  // Round up to nearest 50,000 for nicer scale
                  const roundedMax = Math.ceil(maxFees / 50000) * 50000;
                  
                  // Create array of tick values
                  const tickCount = 5;
                  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => roundedMax * i / tickCount);
                  
                  return ticks.map((tick, i) => {
                    // Position from bottom (0) to top (max)
                    const positionFromBottom = `${(tick / roundedMax) * 100}%`;
                    
                    return (
                      <Box key={i} sx={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `calc(40px + ${positionFromBottom})`, // 40px is the x-axis height
                        zIndex: 0
                      }}>
                        {/* Tick label */}
                        <Typography variant="caption" sx={{ 
                          position: 'absolute',
                          left: 10,
                          bottom: -10,
                          fontWeight: 'bold'
                        }}>
                          {(tick / 1000).toLocaleString()}K
                        </Typography>
                        
                        {/* Grid line */}
                        <Box sx={{ 
                          position: 'absolute',
                          left: 50,
                          right: 0,
                          height: '1px',
                          bgcolor: tick === 0 ? '#333' : '#e0e0e0'
                        }} />
                      </Box>
                    );
                  });
                })()}
                
                {/* X-axis (0 line) */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  bottom: 40,
                  height: 2,
                  bgcolor: '#333',
                  zIndex: 1
                }} />
                
                {/* Bars */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  top: 0,
                  bottom: 40,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around'
                }}>
                  {feesDueByBranch.map((item, index) => {
                    // Calculate max again for consistency
                    const maxFees = Math.max(...feesDueByBranch.map(item => item.amount), 50000);
                    const roundedMax = Math.ceil(maxFees / 50000) * 50000;
                    
                    // Calculate bar height as percentage of available space
                    const heightPercent = (item.amount / roundedMax) * 100;
                    
                    return (
                      <Box key={index} sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        height: '100%'
                      }}>
                        {/* Amount label */}
                        {item.amount > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mb: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            ₹{(item.amount / 1000).toFixed(0)}K
                          </Typography>
                        )}
                        
                        {/* Bar - starts directly from bottom (X-axis) */}
                        <Box sx={{ 
                          width: '1rem',
                          height: `${heightPercent}%`,
                          minHeight: item.amount > 0 ? 2 : 0,
                          bgcolor: '#4caf50',
                          borderRadius: '2px 2px 0 0'
                        }} />
                        
                        {/* Branch label */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            bottom: -35,
                            fontWeight: 'bold',
                            // transform: 'rotate(-45deg)',
                            transformOrigin: 'top center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.branch}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              
              {/* Table below chart */}
              <TableContainer sx={{ mt: 5 }}>
                <Table aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Fees Due (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feesDueByBranch.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.branch}
                        </TableCell>
                        <TableCell align="right">
                          {row.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {feesDueByBranch.reduce((total, row) => total + row.amount, 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ my: 4 }}>
              No students with fees due next month or data not available.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeesDueModal(false)} color="primary">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Fees due this month by branch modal */}
      <Dialog
        open={showFeesDueThisMonthModal}
        onClose={() => setShowFeesDueThisMonthModal(false)}
        aria-labelledby="fees-due-this-month-dialog-title"
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { bgcolor: 'white' } 
        }}
        scroll="paper"
      >
        <DialogTitle id="fees-due-this-month-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Fees Due This Month by Branch</Typography>
            <IconButton onClick={() => setShowFeesDueThisMonthModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {feesDueThisMonthByBranch.length > 0 ? (
            <Box sx={{ mt: 2, mb: 4 }}>
              {/* Chart container */}
              <Box sx={{ 
                height: '280px',
                width: '100%',
                position: 'relative',
                pt: 2,
                pb: 5,
                pl: 6,
                pr: 2,
              }}>
                {/* Y-axis label */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'rotate(-90deg) translateX(50%)',
                    transformOrigin: 'left center',
                    fontWeight: 'bold'
                  }}
                >
                  Fees Due (₹)
                </Typography>
                
                {/* Y-axis ticks and grid lines */}
                {(() => {
                  // Find max value for scale
                  const maxFees = Math.max(...feesDueThisMonthByBranch.map(item => item.amount), 50000);
                  // Round up to nearest 50,000 for nicer scale
                  const roundedMax = Math.ceil(maxFees / 50000) * 50000;
                  
                  // Create array of tick values
                  const tickCount = 5;
                  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => roundedMax * i / tickCount);
                  
                  return ticks.map((tick, i) => {
                    // Position from bottom (0) to top (max)
                    const positionFromBottom = `${(tick / roundedMax) * 100}%`;
                    
                    return (
                      <Box key={i} sx={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `calc(40px + ${positionFromBottom})`, // 40px is the x-axis height
                        zIndex: 0
                      }}>
                        {/* Tick label */}
                        <Typography variant="caption" sx={{ 
                          position: 'absolute',
                          left: 10,
                          bottom: -10,
                          fontWeight: 'bold'
                        }}>
                          {(tick / 1000).toLocaleString()}K
                        </Typography>
                        
                        {/* Grid line */}
                        <Box sx={{ 
                          position: 'absolute',
                          left: 50,
                          right: 0,
                          height: '1px',
                          bgcolor: tick === 0 ? '#333' : '#e0e0e0'
                        }} />
                      </Box>
                    );
                  });
                })()}
                
                {/* X-axis (0 line) */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  bottom: 40,
                  height: 2,
                  bgcolor: '#333',
                  zIndex: 1
                }} />
                
                {/* Bars */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  top: 0,
                  bottom: 40,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around'
                }}>
                  {feesDueThisMonthByBranch.map((item, index) => {
                    // Calculate max again for consistency
                    const maxFees = Math.max(...feesDueThisMonthByBranch.map(item => item.amount), 50000);
                    const roundedMax = Math.ceil(maxFees / 50000) * 50000;
                    
                    // Calculate bar height as percentage of available space
                    const heightPercent = (item.amount / roundedMax) * 100;
                    
                    return (
                      <Box key={index} sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        height: '100%'
                      }}>
                        {/* Amount label */}
                        {item.amount > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mb: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            ₹{(item.amount / 1000).toFixed(0)}K
                          </Typography>
                        )}
                        
                        {/* Bar - starts directly from bottom (X-axis) */}
                        <Box sx={{ 
                          width: '1rem',
                          height: `${heightPercent}%`,
                          minHeight: item.amount > 0 ? 2 : 0,
                          bgcolor: '#f44336',
                          borderRadius: '2px 2px 0 0'
                        }} />
                        
                        {/* Branch label */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            bottom: -35,
                            fontWeight: 'bold',
                            // transform: 'rotate(-45deg)',
                            transformOrigin: 'top center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.branch}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              
              {/* Table below chart */}
              <TableContainer sx={{ mt: 5 }}>
                <Table aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Fees Due (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feesDueThisMonthByBranch.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.branch}
                        </TableCell>
                        <TableCell align="right">
                          {row.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {feesDueThisMonthByBranch.reduce((total, row) => total + row.amount, 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ my: 4 }}>
              No students with fees due this month or data not available.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeesDueThisMonthModal(false)} color="primary">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Recent Joins Modal */}
      <Dialog
        open={showRecentJoinsModal}
        onClose={() => setShowRecentJoinsModal(false)}
        aria-labelledby="recent-joins-dialog-title"
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { bgcolor: 'white' } 
        }}
        scroll="paper"
      >
        <DialogTitle id="recent-joins-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Recent Joins by Branch</Typography>
            <IconButton onClick={() => setShowRecentJoinsModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {recentJoinsByBranch.length > 0 ? (
            <Box sx={{ mt: 2, mb: 4 }}>
              {/* Chart container */}
              <Box sx={{ 
                height: '280px',
                width: '100%',
                position: 'relative',
                pt: 2,
                pb: 5,
                pl: 6,
                pr: 2,
              }}>
                {/* Y-axis label */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'rotate(-90deg) translateX(50%)',
                    transformOrigin: 'left center',
                    fontWeight: 'bold'
                  }}
                >
                  Recent Joins
                </Typography>
                
                {/* Y-axis ticks and grid lines */}
                {(() => {
                  // Find max value for scale
                  const maxJoins = Math.max(...recentJoinsByBranch.map(item => item.count), 10);
                  // Round up to nearest 10 for nicer scale
                  const roundedMax = Math.ceil(maxJoins / 10) * 10;
                  
                  // Create array of tick values
                  const tickCount = 5;
                  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => roundedMax * i / tickCount);
                  
                  return ticks.map((tick, i) => {
                    // Position from bottom (0) to top (max)
                    const positionFromBottom = `${(tick / roundedMax) * 100}%`;
                    
                    return (
                      <Box key={i} sx={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `calc(40px + ${positionFromBottom})`, // 40px is the x-axis height
                        zIndex: 0
                      }}>
                        {/* Tick label */}
                        <Typography variant="caption" sx={{ 
                          position: 'absolute',
                          left: 10,
                          bottom: -10,
                          fontWeight: 'bold'
                        }}>
                          {tick}
                        </Typography>
                        
                        {/* Grid line */}
                        <Box sx={{ 
                          position: 'absolute',
                          left: 50,
                          right: 0,
                          height: '1px',
                          bgcolor: tick === 0 ? '#333' : '#e0e0e0'
                        }} />
                      </Box>
                    );
                  });
                })()}
                
                {/* X-axis (0 line) */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  bottom: 40,
                  height: 2,
                  bgcolor: '#333',
                  zIndex: 1
                }} />
                
                {/* Bars */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  top: 0,
                  bottom: 40,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around'
                }}>
                  {recentJoinsByBranch.map((item, index) => {
                    // Calculate max again for consistency
                    const maxJoins = Math.max(...recentJoinsByBranch.map(item => item.count), 10);
                    const roundedMax = Math.ceil(maxJoins / 10) * 10;
                    
                    // Calculate bar height as percentage of available space
                    const heightPercent = (item.count / roundedMax) * 100;
                    
                    return (
                      <Box key={index} sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        height: '100%'
                      }}>
                        {/* Count label */}
                        {item.count > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mb: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            {item.count}
                          </Typography>
                        )}
                        
                        {/* Bar - starts directly from bottom (X-axis) */}
                        <Box sx={{ 
                          width: '1rem',
                          height: `${heightPercent}%`,
                          minHeight: item.count > 0 ? 2 : 0,
                          bgcolor: '#009688',
                          borderRadius: '2px 2px 0 0'
                        }} />
                        
                        {/* Branch label */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            bottom: -35,
                            fontWeight: 'bold',
                            // transform: 'rotate(-45deg)',
                            transformOrigin: 'top center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.branch}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              
              {/* Table below chart */}
              <TableContainer sx={{ mt: 5 }}>
                <Table aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Recent Joins</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentJoinsByBranch.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.branch}
                        </TableCell>
                        <TableCell align="right">
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {recentJoinsByBranch.reduce((total, row) => total + row.count, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ my: 4 }}>
              No recent joins or data not available.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowRecentJoinsModal(false)} color="primary">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Admission Pending Modal */}
      <Dialog
        open={showAdmissionPendingModal}
        onClose={() => setShowAdmissionPendingModal(false)}
        aria-labelledby="admission-pending-dialog-title"
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { bgcolor: 'white' } 
        }}
        scroll="paper"
      >
        <DialogTitle id="admission-pending-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Admission Pending by Branch</Typography>
            <IconButton onClick={() => setShowAdmissionPendingModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {admissionPendingByBranch.length > 0 ? (
            <Box sx={{ mt: 2, mb: 4 }}>
              {/* Chart container */}
              <Box sx={{ 
                height: '280px',
                width: '100%',
                position: 'relative',
                pt: 2,
                pb: 5,
                pl: 6,
                pr: 2,
              }}>
                {/* Y-axis label */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'rotate(-90deg) translateX(50%)',
                    transformOrigin: 'left center',
                    fontWeight: 'bold'
                  }}
                >
                  Admission Pending
                </Typography>
                
                {/* Y-axis ticks and grid lines */}
                {(() => {
                  // Find max value for scale
                  const maxPending = Math.max(...admissionPendingByBranch.map(item => item.count), 10);
                  // Round up to nearest 10 for nicer scale
                  const roundedMax = Math.ceil(maxPending / 10) * 10;
                  
                  // Create array of tick values
                  const tickCount = 5;
                  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => roundedMax * i / tickCount);
                  
                  return ticks.map((tick, i) => {
                    // Position from bottom (0) to top (max)
                    const positionFromBottom = `${(tick / roundedMax) * 100}%`;
                    
                    return (
                      <Box key={i} sx={{ 
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `calc(40px + ${positionFromBottom})`, // 40px is the x-axis height
                        zIndex: 0
                      }}>
                        {/* Tick label */}
                        <Typography variant="caption" sx={{ 
                          position: 'absolute',
                          left: 10,
                          bottom: -10,
                          fontWeight: 'bold'
                        }}>
                          {tick}
                        </Typography>
                        
                        {/* Grid line */}
                        <Box sx={{ 
                          position: 'absolute',
                          left: 50,
                          right: 0,
                          height: '1px',
                          bgcolor: tick === 0 ? '#333' : '#e0e0e0'
                        }} />
                      </Box>
                    );
                  });
                })()}
                
                {/* X-axis (0 line) */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  bottom: 40,
                  height: 2,
                  bgcolor: '#333',
                  zIndex: 1
                }} />
                
                {/* Bars */}
                <Box sx={{ 
                  position: 'absolute',
                  left: 50,
                  right: 0,
                  top: 0,
                  bottom: 40,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around'
                }}>
                  {admissionPendingByBranch.map((item, index) => {
                    // Calculate max again for consistency
                    const maxPending = Math.max(...admissionPendingByBranch.map(item => item.count), 10);
                    const roundedMax = Math.ceil(maxPending / 10) * 10;
                    
                    // Calculate bar height as percentage of available space
                    const heightPercent = (item.count / roundedMax) * 100;
                    
                    return (
                      <Box key={index} sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        height: '100%'
                      }}>
                        {/* Count label */}
                        {item.count > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mb: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            {item.count}
                          </Typography>
                        )}
                        
                        {/* Bar - starts directly from bottom (X-axis) */}
                        <Box sx={{ 
                          width: '1rem',
                          height: `${heightPercent}%`,
                          minHeight: item.count > 0 ? 2 : 0,
                          bgcolor: '#e65100',
                          borderRadius: '2px 2px 0 0'
                        }} />
                        
                        {/* Branch label */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            bottom: -35,
                            fontWeight: 'bold',
                            // transform: 'rotate(-45deg)',
                            transformOrigin: 'top center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.branch}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              
              {/* Table below chart */}
              <TableContainer sx={{ mt: 5 }}>
                <Table aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Admission Pending</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admissionPendingByBranch.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {row.branch}
                        </TableCell>
                        <TableCell align="right">
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {admissionPendingByBranch.reduce((total, row) => total + row.count, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ my: 4 }}>
              No admission pending or data not available.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAdmissionPendingModal(false)} color="primary">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
    </MainFrame>
  );
}

export default StudentsDatabase;