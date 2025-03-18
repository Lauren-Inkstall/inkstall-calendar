import { useState, useEffect, useContext } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Switch, FormControlLabel, Box, 
  Typography, Divider, Grid, InputAdornment, Select, MenuItem,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Autocomplete, IconButton, Tooltip, FormControl
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { SubjectsContext } from '../context/SubjectsContext';

import DownloadIcon from "@mui/icons-material/Download";
import { BlobProvider, pdf } from '@react-pdf/renderer';
import EditFeeModalPDF from '../pdf/EditFeeModalPDF';

function EditFeeModal({ student, onClose, onSubmit }) {
  console.log("Student data in fee modal:", student);
  
  // Create a local copy of the student object to avoid modifying the original
  const [localStudent, setLocalStudent] = useState({
    ...student,
    subjects: Array.isArray(student.subjects) 
      ? student.subjects.map(subject => 
          typeof subject === 'object' 
            ? { ...subject } 
            : subject
        )
      : [],
    feesInstallment: Array.isArray(student.feesInstallment)
      ? student.feesInstallment.map(installment => ({ 
          ...installment,
          isOriginal: true, // Mark original installments
          isPaidOnOpen: installment.paid > 0 && installment.paidDate !== null // Track if it was paid when opened
        }))
      : []
  });
  
  const [formData, setFormData] = useState({
    basePrice: student.feeConfig?.basePrice || 0,
    gstApplied: student.feeConfig?.gstApplied || false,
    gstPercentage: student.feeConfig?.gstPercentage || 18,
    scholarshipApplied: student.feeConfig?.scholarshipApplied || false,
    scholarshipPercentage: student.feeConfig?.scholarshipPercentage || 10,
    oneToOneApplied: student.feeConfig?.oneToOneApplied || false,
    oneToOnePercentage: student.feeConfig?.oneToOnePercentage || 10,
    customTotalAmount: '',
    subjectFees: student.feeConfig?.subjectFees || {}
  });

  // Initialize subject fees if not present
  useEffect(() => {
    if (localStudent.subjects && Array.isArray(localStudent.subjects) && localStudent.subjects.length > 0) {
      const initialSubjectFees = {};
      
      localStudent.subjects.forEach(subject => {
        const subjectName = typeof subject === 'object' ? subject.name : subject;
        const subjectTotal = typeof subject === 'object' ? subject.total : 0;
        
        if (subjectName && !formData.subjectFees[subjectName]) {
          initialSubjectFees[subjectName] = student.feeConfig?.subjectFees?.[subjectName] || subjectTotal || 0;
        }
      });
      
      if (Object.keys(initialSubjectFees).length > 0) {
        setFormData(prev => ({
          ...prev,
          subjectFees: {
            ...prev.subjectFees,
            ...initialSubjectFees
          }
        }));
      }
    }
  }, [localStudent.subjects]);

  // Initialize and recalculate installments when the modal opens
  useEffect(() => {
    // Run this when the component mounts and when formData changes
    if (localStudent.feesInstallment && Array.isArray(localStudent.feesInstallment)) {
      // Calculate the total fee using the calculateFees function to get the current total
      const fees = calculateFees();
      const totalFee = fees.finalTotal;
      
      // Calculate total paid amount
      const totalPaid = localStudent.feesInstallment.reduce((sum, inst) => sum + (inst.paid || 0), 0);
      
      // Calculate remaining amount to be distributed (ensure it's not negative)
      const remainingAmount = Math.max(0, totalFee - totalPaid);
      
      // Check if there are any unpaid installments
      const hasUnpaidInstallments = localStudent.feesInstallment.some(
        inst => !(inst.paid > 0 && inst.paidDate)
      );
      
      // If there's a remaining amount but no unpaid installments, add a new installment
      if (remainingAmount > 0 && !hasUnpaidInstallments) {
        // Create a new installment with the remaining amount
        const newInstallment = {
          pay: remainingAmount,
          paid: 0,
          dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Due next month
          paidDate: null,
          isOriginal: false,
          isPaidOnOpen: false,
          paymentType: 'cash', // Default payment type
          paymentNotes: '' // Default empty payment notes
        };
        
        // If there are existing installments, set the due date to one month after the last installment
        if (localStudent.feesInstallment.length > 0) {
          const lastInstallment = localStudent.feesInstallment[localStudent.feesInstallment.length - 1];
          if (lastInstallment.dueDate) {
            const lastDueDate = new Date(lastInstallment.dueDate);
            // Helper function to add exactly one month to a date
            const addExactlyOneMonth = (date) => {
              const originalDate = new Date(date);
              const originalDay = originalDate.getDate();
              const originalMonth = originalDate.getMonth();
              const originalYear = originalDate.getFullYear();
              
              // Calculate the target month and year
              let targetMonth = originalMonth + 1;
              let targetYear = originalYear;
              
              // Handle year rollover
              if (targetMonth > 11) {
                targetMonth = 0;
                targetYear++;
              }
              
              // Get the last day of the target month
              const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
              
              // Use the original day, but cap it to the last day of the target month if needed
              const targetDay = Math.min(originalDay, lastDayOfTargetMonth);
              
              // Create and return the new date
              return new Date(targetYear, targetMonth, targetDay);
            };
            
            newInstallment.dueDate = addExactlyOneMonth(lastDueDate);
          }
        }
        
        // Add the new installment to the array
        setLocalStudent(prev => ({
          ...prev,
          feesInstallment: [...prev.feesInstallment, newInstallment]
        }));
        
        // Return early since we've updated the state
        return;
      }
      
      // Recalculate all installments to ensure correct due dates and amounts
      const recalculatedInstallments = recalculateUnpaidInstallments(localStudent.feesInstallment, totalFee);
      
      // Update the local student with recalculated installments
      setLocalStudent(prev => ({
        ...prev,
        feesInstallment: recalculatedInstallments
      }));
    }
  }, [formData]); // Add formData as a dependency to recalculate when it changes

  // Handle change in form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for customTotalAmount
    if (name === 'customTotalAmount') {
      const customTotal = parseFloat(value) || 0;
      
      // If the value is empty or 0, recalculate subject fees based on original calculation
      if (value === '' || customTotal === 0) {
        // Reset subject fees to calculated values
        const updatedSubjectFees = {};
        
        localStudent.subjects.forEach(subject => {
          const subjectName = typeof subject === 'object' ? subject.name : subject;
          const startDate = typeof subject === 'object' && subject.startDate ? subject.startDate : null;
          const endDate = typeof subject === 'object' && subject.endDate ? subject.endDate : null;
          
          // If both dates are set, calculate fee based on date range
          if (startDate && endDate) {
            const { fee } = calculateSubjectFee({ name: subjectName }, startDate, endDate);
            updatedSubjectFees[subjectName] = fee;
          } else {
            // Use existing fee or default to 0
            updatedSubjectFees[subjectName] = formData.subjectFees[subjectName] || 0;
          }
        });
        
        // Update form data with empty custom total and recalculated subject fees
        setFormData({
          ...formData,
          customTotalAmount: '',
          subjectFees: updatedSubjectFees
        });
      } else if (customTotal > 0) {
        // If custom total is positive, distribute equally among subjects
        const subjectCount = localStudent.subjects.length;
        
        if (subjectCount > 0) {
          // Calculate equal share for each subject
          const equalShare = Math.round(customTotal / subjectCount);
          
          // Create updated subject fees with equal distribution
          const updatedSubjectFees = {};
          localStudent.subjects.forEach(subject => {
            const subjectName = typeof subject === 'object' ? subject.name : subject;
            updatedSubjectFees[subjectName] = equalShare;
          });
          
          // Update form data with both the custom total and updated subject fees
          setFormData({
            ...formData,
            customTotalAmount: value,
            subjectFees: updatedSubjectFees
          });
        } else {
          // Just update the custom total if there are no subjects
          setFormData({
            ...formData,
            customTotalAmount: value
          });
        }
      }
    } else {
      // Regular handling for other fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubjectFeeChange = (subjectName, value) => {
    setFormData(prev => ({
      ...prev,
      subjectFees: {
        ...prev.subjectFees,
        [subjectName]: parseFloat(value) || 0
      }
    }));
  };

  // Calculate fee breakdown
  const calculateFees = () => {
    if (formData.customTotalAmount && !isNaN(formData.customTotalAmount)) {
      const customTotal = parseFloat(formData.customTotalAmount);
      if (customTotal > 0) {
        return {
          baseAmount: customTotal,
          gstAmount: 0,
          scholarshipAmount: 0,
          oneToOneAmount: 0,
          finalTotal: customTotal,
          subjectBreakdown: {}
        };
      }
    }

    // Calculate total from subject fees if available
    const subjectFees = formData.subjectFees || {};
    const subjectTotal = Object.values(subjectFees).reduce((sum, fee) => sum + (parseFloat(fee) || 0), 0);
    
    // Use subject total if available, otherwise use base price
    let baseAmount = subjectTotal > 0 ? subjectTotal : (parseFloat(formData.basePrice) || 0);
    
    // Apply scholarship discount if enabled
    const scholarshipAmount = formData.scholarshipApplied 
      ? Math.round(baseAmount * (formData.scholarshipPercentage / 100)) 
      : 0;
    
    // Apply one-to-one increase if enabled
    const oneToOneAmount = formData.oneToOneApplied 
      ? Math.round(baseAmount * (formData.oneToOnePercentage / 100)) 
      : 0;
    
    // Calculate base amount after scholarship and one-to-one
    baseAmount = baseAmount - scholarshipAmount + oneToOneAmount;
    
    // Calculate GST if enabled
    const gstAmount = formData.gstApplied 
      ? Math.round(baseAmount * (formData.gstPercentage / 100)) 
      : 0;
    
    // Calculate final total
    const finalTotal = baseAmount + gstAmount;
    
    // Calculate subject breakdown
    const subjectBreakdown = {};
    if (subjectTotal > 0) {
      Object.entries(subjectFees).forEach(([subject, fee]) => {
        const subjectFee = parseFloat(fee) || 0;
        if (subjectFee > 0) {
          // Calculate proportional adjustments
          const proportion = subjectFee / subjectTotal;
          const subjectScholarship = formData.scholarshipApplied ? Math.round(subjectFee * (formData.scholarshipPercentage / 100)) : 0;
          const subjectOneToOne = formData.oneToOneApplied ? Math.round(subjectFee * (formData.oneToOnePercentage / 100)) : 0;
          const subjectBase = subjectFee - subjectScholarship + subjectOneToOne;
          const subjectGst = formData.gstApplied ? Math.round(subjectBase * (formData.gstPercentage / 100)) : 0;
          
          subjectBreakdown[subject] = {
            base: subjectFee,
            scholarship: subjectScholarship,
            oneToOne: subjectOneToOne,
            gst: subjectGst,
            total: subjectBase + subjectGst
          };
        }
      });
    }
    
    return {
      baseAmount,
      gstAmount,
      scholarshipAmount,
      oneToOneAmount,
      finalTotal,
      subjectBreakdown
    };
  };

  // Calculate subtotal from subject fees
  const calculateSubtotal = () => {
    return Object.values(formData.subjectFees).reduce((sum, fee) => sum + (parseFloat(fee) || 0), 0);
  };

  // Calculate fee for a new subject based on board, grade, and branch
  const calculateSubjectFee = (subject, startDate, endDate) => {
    // Base rate based on branch and board
    let baseRate;
    if (student.branch === "Online") {
      baseRate = 1500;
    } else {
      switch (student.board) {
        case "IGCSE": baseRate = 1200; break;
        case "IB": baseRate = 2500; break;
        case "NIOS": baseRate = 3000; break;
        case "CBSE":
        case "SSC": baseRate = 800; break;
        default: baseRate = 800;
      }
    }
    
    // Grade multiplier
    let gradeMultiplier = 1;
    const earlyGrades = ["Playschool", "Nurserry", "Jr. KG", "Sr. KG", "1"];
    if (!earlyGrades.includes(student.grade)) {
      const gradeNum = parseInt(student.grade);
      if (!isNaN(gradeNum) && gradeNum > 1) {
        gradeMultiplier = Math.pow(1.1, gradeNum - 1);
      }
    }
    
    // Calculate base monthly rate
    const baseMonthlyRate = baseRate * gradeMultiplier;
    
    // Calculate fee based on days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate daily rate and total fee
    const dailyRate = baseMonthlyRate / 30;
    const subjectFee = Math.round(dailyRate * days);
    
    return {
      fee: subjectFee,
      startDate: start,
      endDate: end
    };
  };

  const feeBreakdown = calculateFees();
  
  // Get subjects from context
  const { subjects: allSubjects, loading: subjectsLoading } = useContext(SubjectsContext);
  
  // State for new subject selection
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Get available subjects (those not already assigned to the student)
  const getAvailableSubjects = () => {
    if (!allSubjects || !localStudent.subjects) return [];
    
    const studentSubjectNames = localStudent.subjects.map(subject => 
      typeof subject === 'object' ? subject.name : subject
    );
    
    return allSubjects.filter(subject => 
      !studentSubjectNames.includes(subject.name)
    );
  };
  
  // Handle adding a new subject
  const handleAddSubject = () => {
    if (!selectedSubject) return;
    
    // Find the selected subject object
    const subjectToAdd = allSubjects.find(s => s.name === selectedSubject);
    
    if (!subjectToAdd) return;
    
    // Create a new subject object with empty dates initially
    const newSubject = {
      name: subjectToAdd.name,
      startDate: null,
      endDate: null,
      total: 0
    };
    
    // Update the local student object with the new subject
    setLocalStudent(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
    
    // Update the form data with the new subject fee
    setFormData(prev => ({
      ...prev,
      subjectFees: {
        ...prev.subjectFees,
        [newSubject.name]: 0
      }
    }));
    
    // Reset the selection
    setSelectedSubject('');
  };

  // Handle deleting a subject
  const handleDeleteSubject = (subjectName) => {
    // Remove the subject from localStudent
    setLocalStudent(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => 
        (typeof subject === 'object' && subject.name !== subjectName) || 
        (typeof subject === 'string' && subject !== subjectName)
      )
    }));
    
    // Remove the subject fee from formData
    setFormData(prev => {
      const updatedSubjectFees = { ...prev.subjectFees };
      delete updatedSubjectFees[subjectName];
      
      return {
        ...prev,
        subjectFees: updatedSubjectFees
      };
    });
  };

  // Handle date change for subjects
  const handleSubjectDateChange = (subjectName, field, newDate) => {
    // Get the current subject
    const currentSubject = localStudent.subjects.find(
      s => (typeof s === 'object' && s.name === subjectName) || s === subjectName
    );
    
    // Convert to object if it's just a string
    const subjectObj = typeof currentSubject === 'object' 
      ? { ...currentSubject } 
      : { name: currentSubject };
    
    // Prepare the updated dates
    let startDate = field === 'startDate' ? newDate : subjectObj.startDate;
    let endDate = field === 'endDate' ? newDate : subjectObj.endDate;
    
    // Validate dates - ensure end date is not before start date
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      if (field === 'startDate') {
        // If setting start date after end date, reset end date
        endDate = null;
      } else {
        // If setting end date before start date, don't update
        return;
      }
    }
    
    // Update the local student object
    setLocalStudent(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject => {
        if ((typeof subject === 'object' && subject.name === subjectName) || subject === subjectName) {
          return {
            ...(typeof subject === 'object' ? subject : { name: subject }),
            startDate,
            endDate: field === 'endDate' ? newDate : subject.endDate
          };
        }
        return subject;
      })
    }));
    
    // Recalculate fee if both dates are set
    if (startDate && endDate) {
      // Calculate fee based on the date range using the logic from Students.jsx
      const { fee } = calculateSubjectFee({ name: subjectName }, startDate, endDate);
      
      // Update the form data with the new calculated fee
      setFormData(prev => ({
        ...prev,
        subjectFees: {
          ...prev.subjectFees,
          [subjectName]: fee
        }
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted!");
    
    // Calculate the total amount (either custom or calculated subtotal)
    const totalAmount = formData.customTotalAmount 
      ? parseFloat(formData.customTotalAmount) 
      : calculateSubtotal();
    
    console.log("Calculated total amount:", totalAmount);
    
    // Create the updated fee configuration with all necessary fields
    const updatedFeeConfig = {
      basePrice: parseFloat(formData.basePrice) || 0,
      totalAmount: totalAmount,
      subjectFees: formData.subjectFees,
      // Include these fields to maintain compatibility with existing schema
      gstApplied: false,
      gstPercentage: 0,
      gstAmount: 0,
      scholarshipApplied: false,
      scholarshipPercentage: 0,
      scholarshipAmount: 0,
      oneToOneApplied: false,
      oneToOnePercentage: 0,
      oneToOneAmount: 0,
      // Required by schema
      baseAmount: parseFloat(formData.basePrice) || 0, // Using basePrice as baseAmount
    };
    
    console.log("Updated fee config:", updatedFeeConfig);
    
    // Update the subjects array with the fee information
    const updatedSubjects = localStudent.subjects.map(subject => {
      const subjectName = typeof subject === 'object' ? subject.name : subject;
      const subjectFee = formData.subjectFees[subjectName] || 0;
      
      // Get start and end dates
      let startDate = null;
      let endDate = null;
      
      if (typeof subject === 'object') {
        startDate = subject.startDate || new Date(); // Default to today if missing
        endDate = subject.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)); // Default to 3 months from now if missing
      } else {
        // Default dates for string subjects
        startDate = new Date();
        endDate = new Date(new Date().setMonth(new Date().getMonth() + 3)); // 3 months from now
      }
      
      // If it's already an object, update its properties
      if (typeof subject === 'object') {
        return {
          ...subject,
          name: subjectName, // Ensure name is included
          total: subjectFee,
          // Ensure dates are present and valid
          startDate: startDate,
          endDate: endDate
        };
      } 
      // If it's just a string, convert to object with fee
      else {
        return {
          name: subject,
          total: subjectFee,
          startDate: startDate,
          endDate: endDate
        };
      }
    });
    
    console.log("Updated subjects:", updatedSubjects);
    
    // Create a complete updated student object
    const updatedStudent = {
      ...student,
      feeConfig: updatedFeeConfig,
      subjects: updatedSubjects,
      feesInstallment: localStudent.feesInstallment,
      // Include the total amount at the student level for consistency
      totalAmount: totalAmount
    };
    
    console.log("Calling onSubmit with data:", {
      feeConfig: updatedFeeConfig,
      subjects: updatedSubjects,
      feesInstallment: localStudent.feesInstallment,
      totalAmount: totalAmount
    });
    
    // Pass the complete updated student object to the submit handler
    onSubmit({
      feeConfig: updatedFeeConfig,
      subjects: updatedSubjects,
      feesInstallment: localStudent.feesInstallment,
      totalAmount: totalAmount
    });
  };

  // Helper function to recalculate all unpaid installments
  const recalculateUnpaidInstallments = (installments, totalFee) => {
    // Calculate total paid amount
    const totalPaid = installments.reduce((sum, inst) => sum + (inst.paid || 0), 0);
    
    // Calculate remaining amount to be distributed (ensure it's not negative)
    const remainingAmount = Math.max(0, totalFee - totalPaid);
    
    // Create a new array with updated installments
    const updatedInstallments = [...installments];
    
    // Find unpaid installments
    const unpaidIndices = [];
    for (let i = 0; i < updatedInstallments.length; i++) {
      if (!(updatedInstallments[i].paid > 0 && updatedInstallments[i].paidDate)) {
        unpaidIndices.push(i);
      }
    }
    
    // If there are unpaid installments
    if (unpaidIndices.length > 0) {
      // For multiple unpaid installments, distribute evenly
      const equalShare = Math.floor(remainingAmount / unpaidIndices.length);
      let remainder = remainingAmount % unpaidIndices.length;
      
      // Update payment amounts for all unpaid installments
      for (let i = 0; i < unpaidIndices.length; i++) {
        const index = unpaidIndices[i];
        
        // Add 1 to the first few installments to distribute the remainder
        const thisShare = i < remainder ? equalShare + 1 : equalShare;
        
        // Update the installment amount
        updatedInstallments[index] = {
          ...updatedInstallments[index],
          pay: thisShare
        };
      }
    }
    
    // Helper function to add exactly one month to a date while preserving the day of month when possible
    const addExactlyOneMonth = (date) => {
      const originalDate = new Date(date);
      const originalDay = originalDate.getDate();
      const originalMonth = originalDate.getMonth();
      const originalYear = originalDate.getFullYear();
      
      // Calculate the target month and year
      let targetMonth = originalMonth + 1;
      let targetYear = originalYear;
      
      // Handle year rollover
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
      
      // Get the last day of the target month
      const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      
      // Use the original day, but cap it to the last day of the target month if needed
      const targetDay = Math.min(originalDay, lastDayOfTargetMonth);
      
      // Create and return the new date
      return new Date(targetYear, targetMonth, targetDay);
    };
    
    // Now ensure all installments have sequential due dates (1 month apart)
    // For each installment after the first one, set its due date to be 1 month after the previous
    for (let i = 1; i < updatedInstallments.length; i++) {
      const prevDueDate = new Date(updatedInstallments[i-1].dueDate);
      const newDueDate = addExactlyOneMonth(prevDueDate);
      
      // Update the installment with the new due date
      updatedInstallments[i] = {
        ...updatedInstallments[i],
        dueDate: newDueDate
      };
    }
    
    return updatedInstallments;
  };

  // Handle installment changes
  const handleInstallmentChange = (index, field, value) => {
    setLocalStudent(prev => {
      const updatedInstallments = [...prev.feesInstallment];
      
      // Store the old values before updating
      const oldValue = updatedInstallments[index][field];
      const oldPaidValue = field === 'paid' ? updatedInstallments[index].paid || 0 : null;
      const oldPaidDate = field === 'paidDate' ? updatedInstallments[index].paidDate : null;
      
      // Update the specific field
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        [field]: value
      };
      
      // Calculate total fee
      const totalFee = formData.customTotalAmount 
        ? parseFloat(formData.customTotalAmount) 
        : calculateSubtotal();
      
      // If the pay amount was changed, recalculate other unpaid installments
      if (field === 'pay' && oldValue !== value) {
        // Skip recalculation if this is a paid installment
        if (!(updatedInstallments[index].paid > 0 && updatedInstallments[index].paidDate)) {
          // Calculate total paid amount
          const totalPaid = updatedInstallments.reduce((sum, inst) => sum + (inst.paid || 0), 0);
          
          // Calculate total amount assigned to this and other paid installments
          const assignedAmount = value + updatedInstallments.reduce((sum, inst, i) => {
            // Include paid installments and exclude the current one
            if (i !== index && (inst.paid > 0 && inst.paidDate)) {
              return sum + (inst.pay || 0);
            }
            return sum;
          }, 0);
          
          // Calculate remaining amount to distribute among other unpaid installments
          const remainingToDistribute = totalFee - assignedAmount;
          
          // Count other unpaid installments
          const otherUnpaidInstallments = updatedInstallments.filter((inst, i) => 
            i !== index && !(inst.paid > 0 && inst.paidDate)
          );
          
          // If there are other unpaid installments and remaining amount is positive
          if (otherUnpaidInstallments.length > 0 && remainingToDistribute > 0) {
            // Calculate equal share for each other unpaid installment
            const equalShare = Math.round(remainingToDistribute / otherUnpaidInstallments.length);
            
            // Update other unpaid installments
            for (let i = 0; i < updatedInstallments.length; i++) {
              if (i !== index && !(updatedInstallments[i].paid > 0 && updatedInstallments[i].paidDate)) {
                updatedInstallments[i] = {
                  ...updatedInstallments[i],
                  pay: equalShare
                };
              }
            }
          }
        }
      }
      
      // If the paid amount or paid date was changed, check if the installment is now considered paid
      if ((field === 'paid' && oldPaidValue !== value) || (field === 'paidDate' && oldPaidDate !== value)) {
        const currentInstallment = updatedInstallments[index];
        
        // Check if the installment is now considered paid (has paid amount and paid date)
        const isNowPaid = currentInstallment.paid > 0 && currentInstallment.paidDate;
        
        // If it's now paid, recalculate remaining installments
        if (isNowPaid) {
          // Recalculate all unpaid installments
          const recalculatedInstallments = recalculateUnpaidInstallments(updatedInstallments, totalFee);
          
          return {
            ...prev,
            feesInstallment: recalculatedInstallments
          };
        }
      }
      
      return {
        ...prev,
        feesInstallment: updatedInstallments
      };
    });
  };

  // Add a new installment
  const handleAddInstallment = () => {
    setLocalStudent(prev => {
      // Calculate total fee
      const totalFee = formData.customTotalAmount 
        ? parseFloat(formData.customTotalAmount) 
        : calculateSubtotal();
      
      // Create a new installment with default values
      const newInstallment = {
        pay: 0, // This will be calculated later
        paid: 0,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        paidDate: null,
        isOriginal: false, // Mark as not original
        paymentType: 'cash', // Default payment type
        paymentNotes: '' // Default empty payment notes
      };
      
      // Add the new installment to the array
      const installmentsWithNew = [...prev.feesInstallment, newInstallment];
      
      // Recalculate all unpaid installments including the new one
      const recalculatedInstallments = recalculateUnpaidInstallments(installmentsWithNew, totalFee);
      
      return {
        ...prev,
        feesInstallment: recalculatedInstallments
      };
    });
  };

  // Check if an installment has been paid
  const isInstallmentPaid = (installment) => {
    // Only consider an installment as paid (for disabling fields) if it was already paid when the modal was opened
    // This prevents fields from being disabled when a user is currently editing the installment
    return installment.isPaidOnOpen === true;
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Fee Details</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              try {
                // Create the PDF document
                const pdfDocument = (
                  <EditFeeModalPDF
                    student={localStudent}
                    calculatedFees={calculateFees()}
                    showUSD={false}
                  />
                );
                
                // Generate the PDF blob
                pdf(pdfDocument)
                  .toBlob()
                  .then((blob) => {
                    // Create a URL for the blob
                    const url = URL.createObjectURL(blob);
                    
                    // Create a link element
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Fee_Statement_${localStudent.name || 'Student'}.pdf`;
                    
                    // Append to the document, click it, and remove it
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Clean up the URL object
                    URL.revokeObjectURL(url);
                  })
                  .catch((error) => {
                    console.error("Error generating PDF:", error);
                    alert("Could not generate PDF due to an error.");
                  });
              } catch (error) {
                console.error("Error creating PDF document:", error);
                alert("Could not generate PDF due to an error.");
              }
            }}
          >
            Download Fee Statement
          </Button>
          <Button onClick={onClose} size="small" startIcon={<Close />}>
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <form id="edit-fee-form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Manage Subjects</Typography>
                
                {/* Add Subject Dropdown */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
                  <Autocomplete
                    value={selectedSubject ? allSubjects.find(s => s.name === selectedSubject) || null : null}
                    onChange={(event, newValue) => {
                      setSelectedSubject(newValue ? newValue.name : '');
                    }}
                    options={getAvailableSubjects()}
                    getOptionLabel={(option) => option.name || ''}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Search and select a subject" 
                        variant="outlined"
                        size="small"
                      />
                    )}
                    sx={{ flexGrow: 1, mr: 1 }}
                    disableClearable
                  />
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<Add />}
                    onClick={handleAddSubject}
                    disabled={!selectedSubject}
                  >
                    Add
                  </Button>
                </Box>
                
                {Array.isArray(localStudent.subjects) && localStudent.subjects.length > 0 ? (
                  <Box>
                    {localStudent.subjects.map((subject, index) => {
                      const subjectName = typeof subject === 'object' ? subject.name : subject;
                      const subjectFee = formData.subjectFees[subjectName] || 0;
                      const startDate = typeof subject === 'object' && subject.startDate ? subject.startDate : null;
                      const endDate = typeof subject === 'object' && subject.endDate ? subject.endDate : null;
                      
                      return (
                        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ flexGrow: 1, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">{subjectName}</Typography>
                          </Box>
                          
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              label="Start Date"
                              value={startDate ? dayjs(startDate) : null}
                              onChange={(newDate) => handleSubjectDateChange(subjectName, 'startDate', newDate ? newDate.toDate() : null)}
                              slotProps={{ textField: { size: 'small', sx: { width: '150px' } } }}
                            />
                          </LocalizationProvider>
                          
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              label="End Date"
                              value={endDate ? dayjs(endDate) : null}
                              onChange={(newDate) => handleSubjectDateChange(subjectName, 'endDate', newDate ? newDate.toDate() : null)}
                              slotProps={{ 
                                textField: { 
                                  size: 'small', 
                                  sx: { width: '150px' },
                                } 
                              }}
                              minDate={startDate ? dayjs(startDate) : undefined}
                              disabled={!startDate}
                            />
                          </LocalizationProvider>
                          
                          <TextField
                            label="Fee"
                            name={subjectName}
                            type="number"
                            value={subjectFee}
                            onChange={(e) => handleSubjectFeeChange(subjectName, e.target.value)}
                            fullWidth
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            sx={{ width: '150px' }}
                          />
                          <Tooltip title="Delete subject">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteSubject(subjectName)}
                              sx={{ ml: 1 }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 2,
                        pt: 1,
                        borderTop: '1px solid #ddd'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Subtotal:</Typography>
                      <Typography variant="body2">₹ {calculateSubtotal().toLocaleString()}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No subjects assigned</Typography>
                )}
              </Box>
            </Grid>

            {/* Installment Section */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
                    Installment Plan
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<Add />}
                    onClick={handleAddInstallment}
                    sx={{ 
                      borderRadius: '8px', 
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                    }}
                  >
                    Add Installment
                  </Button>
                </Box>
                
                {Array.isArray(localStudent.feesInstallment) && localStudent.feesInstallment.length > 0 ? (
                  <Box sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: 'none' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Payment Details</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {localStudent.feesInstallment.map((installment, index) => {
                            const isPaid = isInstallmentPaid(installment);
                            return (
                            <TableRow 
                              key={index}
                              sx={{ 
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                                ...(isPaid && { backgroundColor: 'rgba(76, 175, 80, 0.04)' })
                              }}
                            >
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Due Amount
                                    </Typography>
                                    <TextField
                                      type="text"
                                      value={isPaid ? (installment.pay || 0) : (installment.pay === 0 ? '0' : String(Number(installment.pay || 0)))}
                                      onChange={(e) => {
                                        // Only allow numeric input and remove leading zeros
                                        const inputValue = e.target.value.replace(/^0+(?=\d)/, '').replace(/[^\d.]/g, '');
                                        handleInstallmentChange(index, 'pay', inputValue ? parseFloat(inputValue) : 0);
                                      }}
                                      size="small"
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        sx: { borderRadius: '8px' }
                                      }}
                                      disabled={isPaid}
                                      fullWidth
                                      sx={{ 
                                        '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                        ...(isPaid && { '& .MuiInputBase-input': { color: 'text.secondary' } })
                                      }}
                                    />
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Payment Amount
                                    </Typography>
                                    <TextField
                                      type="text"
                                      value={isPaid ? (installment.paid || 0) : (installment.paid === 0 ? '0' : String(Number(installment.paid || 0)))}
                                      onChange={(e) => {
                                        // Only allow numeric input and remove leading zeros
                                        const inputValue = e.target.value.replace(/^0+(?=\d)/, '').replace(/[^\d.]/g, '');
                                        handleInstallmentChange(index, 'paid', inputValue ? parseFloat(inputValue) : 0);
                                      }}
                                      size="small"
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        sx: { borderRadius: '8px' }
                                      }}
                                      disabled={isPaid}
                                      fullWidth
                                      sx={{ 
                                        '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                        ...(isPaid && { '& .MuiInputBase-input': { color: 'success.main', fontWeight: 'medium' } })
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Due Date
                                    </Typography>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      <DatePicker
                                        value={installment.dueDate ? dayjs(installment.dueDate) : null}
                                        onChange={(newDate) => handleInstallmentChange(index, 'dueDate', newDate ? newDate.toDate() : null)}
                                        slotProps={{ 
                                          textField: { 
                                            size: 'small', 
                                            fullWidth: true,
                                            sx: { 
                                              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                              ...(isPaid && { '& .MuiInputBase-input': { color: 'text.secondary' } })
                                            }
                                          } 
                                        }}
                                        disabled={isPaid}
                                      />
                                    </LocalizationProvider>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Payment Date
                                    </Typography>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      <DatePicker
                                        value={installment.paidDate ? dayjs(installment.paidDate) : null}
                                        onChange={(newDate) => handleInstallmentChange(index, 'paidDate', newDate ? newDate.toDate() : null)}
                                        slotProps={{ 
                                          textField: { 
                                            size: 'small', 
                                            fullWidth: true,
                                            sx: { 
                                              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                              ...(isPaid && { '& .MuiInputBase-input': { color: 'success.main', fontWeight: 'medium' } })
                                            }
                                          } 
                                        }}
                                        disabled={isPaid}
                                      />
                                    </LocalizationProvider>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Payment Mode
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={installment.paymentType || 'cash'}
                                        onChange={(e) => handleInstallmentChange(index, 'paymentType', e.target.value)}
                                        disabled={isPaid}
                                        sx={{ 
                                          borderRadius: '8px',
                                          ...(isPaid && { '& .MuiSelect-select': { color: 'success.main', fontWeight: 'medium' } })
                                        }}
                                      >
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="upi">UPI</MenuItem>
                                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                        <MenuItem value="card">Card</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 0.5, display: 'block' }}>
                                      Payment Notes
                                    </Typography>
                                    <TextField
                                      type="text"
                                      value={installment.paymentNotes || ''}
                                      onChange={(e) => handleInstallmentChange(index, 'paymentNotes', e.target.value)}
                                      size="small"
                                      disabled={isPaid}
                                      fullWidth
                                      placeholder="Add payment details..."
                                      sx={{ 
                                        '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                        ...(isPaid && { '& .MuiInputBase-input': { color: 'text.secondary' } })
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Tooltip title="Delete installment">
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => {
                                        setLocalStudent(prev => {
                                          // First, remove the installment
                                          const updatedInstallments = prev.feesInstallment.filter((_, i) => i !== index);
                                          
                                          // Calculate total fee
                                          const totalFee = formData.customTotalAmount 
                                            ? parseFloat(formData.customTotalAmount) 
                                            : calculateSubtotal();
                                          
                                          // Recalculate all unpaid installments after deletion
                                          const recalculatedInstallments = recalculateUnpaidInstallments(updatedInstallments, totalFee);
                                          
                                          return {
                                            ...prev,
                                            feesInstallment: recalculatedInstallments
                                          };
                                        });
                                      }}
                                      disabled={isPaid || installment.isOriginal}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )})}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No installments available</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="edit-fee-form" 
          color="primary" 
          variant="contained"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditFeeModal;