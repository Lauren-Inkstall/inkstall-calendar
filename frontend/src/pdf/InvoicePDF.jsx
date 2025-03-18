import React from "react";
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import dayjs from "dayjs";

// Styles for the PDF
const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontSize: 10,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #ccc',
    paddingBottom: 10
  },
  headerRight: {
    textAlign: 'right'
  },
  currencyNote: { 
    fontSize: 9, 
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#555'
  },
  section: { 
    marginBottom: 15 
  },
  title: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 3
  },
  row: { 
    flexDirection: 'row', 
    marginBottom: 3 
  },
  label: { 
    width: 80 
  },
  value: { 
    flex: 1 
  },
  period: { 
    marginTop: 5, 
    marginBottom: 10 
  },
  table: { 
    marginTop: 10,
    marginBottom: 15
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1, 
    borderBottomColor: '#000', 
    paddingVertical: 7,
    paddingHorizontal: 5,
    fontWeight: 'bold'
  },
  tableBody: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  subjectCol: { 
    flex: 2,
    paddingHorizontal: 5
  },
  daysCol: { 
    flex: 1, 
    textAlign: 'center' 
  },
  amountCol: { 
    flex: 1, 
    textAlign: 'right',
    paddingRight: 5
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  feeDetails: { 
    marginTop: 15, 
    width: '50%', 
    alignSelf: 'flex-end',
    borderTop: '1px solid #ccc',
    paddingTop: 5
  },
  feeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  bold: { 
    fontWeight: 'bold' 
  },
  installmentSection: { 
    marginTop: 15 
  },
  contactSection: { 
    marginTop: 30, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    borderTop: '1px solid #ccc',
    paddingTop: 10
  },
  bankDetails: { 
    width: '45%' 
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #ccc',
    paddingTop: 10
  },
  periodText: {
    fontSize: 8, 
    color: '#666', 
    marginBottom: 5,
    fontStyle: 'italic'
  }
});

const InvoicePDF = ({ student = {}, subjects = [], feeBreakdown = {}, installment = [], showUSD = false, usdRate = null }) => {
  console.log("student", student);
  console.log("subjects", subjects);
  console.log("feeBreakdown", feeBreakdown);
  console.log("installment", installment);
  console.log("showUSD", showUSD);
  console.log("usdRate", usdRate);
  const currentDate = dayjs().format("DD/MM/YYYY");
  
  // Safe formatting functions
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) return "0.00";
    const numAmount = parseFloat(amount);
    const value = showUSD && usdRate ? (numAmount / usdRate).toFixed(2) : numAmount.toFixed(2);
    return value;
  };
  
  // Improved date formatting function that handles different date formats
  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    
    try {
      // First try parsing as is
      let date = dayjs(dateInput);
      
      // If already in DD/MM/YYYY format, parse it correctly
      if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY format
          date = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      if (!date.isValid()) return "";
      return date.format("DD/MM/YYYY");
    } catch (e) {
      return "";
    }
  };
  
  // Improved period text function
  const getPeriodText = (startDate, endDate) => {
    if (!startDate || !endDate) return "Dates not set";
    
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);
    
    if (!formattedStart || !formattedEnd) return "Invalid dates";
    return `${formattedStart} to ${formattedEnd}`;
  };
  
  // Improved days calculation
  const getDays = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    
    try {
      // Parse dates, handling different formats
      let start = dayjs(startDate);
      let end = dayjs(endDate);
      
      // If dates are in DD/MM/YYYY format, parse them correctly
      if (typeof startDate === 'string' && startDate.includes('/')) {
        const parts = startDate.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY format
          start = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      if (typeof endDate === 'string' && endDate.includes('/')) {
        const parts = endDate.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY format
          end = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      if (!start.isValid() || !end.isValid()) return "N/A";
      
      // Calculate days and ensure it's a positive number
      const days = Math.max(1, end.diff(start, 'days') + 1);
      return `${days} days`;
    } catch (e) {
      return "N/A";
    }
  };
  
  // Filter valid subjects
  const validSubjects = Array.isArray(subjects) ? 
    subjects.filter(s => s && s.subject) : [];
  
  // Safe access to fee breakdown
  const subjectFees = Array.isArray(feeBreakdown?.subjectFees) ? 
    feeBreakdown.subjectFees : [];
  
  const installments = Array.isArray(feeBreakdown?.installments) ? 
    feeBreakdown.installments : [];
    
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
          <Image 
            src="/public/inkstall.jpg" 
            style={{ height: 60, width: "auto", marginBottom: 8 }} 
          />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.bold}>Invoice</Text>
            <Text>Date: {currentDate}</Text>
            <Text>Invoice #: INV-{dayjs().format("YYYYMMDD")}-{student?.name ? student.name.substring(0, 3).toUpperCase() : "XXX"}</Text>
          </View>
        </View>

        <Text style={styles.currencyNote}>All amounts are in {showUSD ? "USD" : "INR"}</Text>

        {/* Student Details Section */}
        <View style={styles.section}>
          <Text style={styles.title}>Student Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{student?.name || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Grade:</Text>
            <Text style={styles.value}>{student?.grade || ""}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Board:</Text>
            <Text style={styles.value}>{student?.board || ""}</Text>
          </View>
        </View>

        {/* Subject-wise Fees Table */}
        <View style={styles.table}>
          <Text style={styles.title}>Subject-wise Fees:</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.subjectCol}>Subject</Text>
            <Text style={styles.daysCol}>Period</Text>
            <Text style={styles.amountCol}>Total</Text>
          </View>
          
          {/* Table Body */}
          <View style={styles.tableBody}>
            {validSubjects.length > 0 ? (
              validSubjects.map((subject, index) => {
                const fee = subjectFees.find(f => f.subject === subject.subject)?.fee || 0;
                return (
                  <View key={index}>
                    <View style={styles.tableRow}>
                      <Text style={styles.subjectCol}>{subject.subject}</Text>
                      <Text style={styles.daysCol}>
                        {getDays(subject.startDate, subject.endDate)}
                      </Text>
                      <Text style={styles.amountCol}>{formatAmount(fee)}</Text>
                    </View>
                    <Text style={styles.periodText}>
                      {getPeriodText(subject.startDate, subject.endDate)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.subjectCol}>No subjects</Text>
                <Text style={styles.daysCol}>-</Text>
                <Text style={styles.amountCol}>0.00</Text>
              </View>
            )}
          </View>
        </View>

        {/* Fee Summary */}
        <View style={styles.feeDetails}>
          <View style={styles.feeRow}>
            <Text>Subtotal</Text>
            <Text>{formatAmount(feeBreakdown?.subtotal || 0)}</Text>
          </View>
          
          {(feeBreakdown?.scholarshipDiscount?.amount || 0) > 0 && (
            <View style={styles.feeRow}>
              <Text>Scholarship ({feeBreakdown?.scholarshipDiscount?.percentage || 0}%)</Text>
              <Text>-{formatAmount(feeBreakdown?.scholarshipDiscount?.amount || 0)}</Text>
            </View>
          )}
          
          {(feeBreakdown?.subjectDiscount?.amount || 0) > 0 && (
            <View style={styles.feeRow}>
              <Text>Subject Discount ({feeBreakdown?.subjectDiscount?.percentage || 0}%)</Text>
              <Text>-{formatAmount(feeBreakdown?.subjectDiscount?.amount || 0)}</Text>
            </View>
          )}
          
          <View style={styles.feeRow}>
            <Text>Base Amount</Text>
            <Text>{formatAmount(feeBreakdown?.baseAmount || 0)}</Text>
          </View>
          
          {(feeBreakdown?.gstAmount || 0) > 0 && (
            <View style={styles.feeRow}>
              <Text>GST (18%)</Text>
              <Text>{formatAmount(feeBreakdown?.gstAmount || 0)}</Text>
            </View>
          )}
          
          <View style={[styles.feeRow, styles.bold]}>
            <Text>Total Amount</Text>
            <Text>{formatAmount(feeBreakdown?.finalTotal || 0)}</Text>
          </View>
        </View>

        {/* Payment Schedule Table */}
        <View style={styles.installmentSection}>
          <Text style={styles.title}>Payment Schedule:</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.subjectCol}>Installment</Text>
            <Text style={styles.daysCol}>Due Date</Text>
            <Text style={styles.amountCol}>Amount</Text>
          </View>
          
          {/* Table Body */}
          <View style={styles.tableBody}>
            {installments.length > 0 ? (
              installments.map((inst, index) => (
                <View style={styles.tableRow} key={index}>
                  <Text style={styles.subjectCol}>Installment {index + 1}</Text>
                  <Text style={styles.daysCol}>{formatDate(inst.dueDate)}</Text>
                  <Text style={styles.amountCol}>
                    {formatAmount(inst.pay || inst.amount || 0)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.subjectCol}>No installments</Text>
                <Text style={styles.daysCol}>-</Text>
                <Text style={styles.amountCol}>0.00</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer with Contact and Bank Details */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '45%' }}>
              <Text style={styles.title}>Contact Details:</Text>
              <Text>E-mail: contact@inkstall.com</Text>
              <Text>Phone: 9820351334</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.title}>Bank Account Details:</Text>
              <Text>Account Name: Inkstall Solutions LLP</Text>
              <Text>Account No: 50200078489380</Text>
              <Text>IFSC Code: HDFC0000212</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;