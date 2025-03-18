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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e'
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
    width: 120 
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
  installmentCol: {
    flex: 1.5,
    paddingHorizontal: 5
  },
  dateCol: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 5
  },
  paidCol: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 10
  },
  dueCol: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 10
  },
  statusCol: {
    flex: 0.8,
    textAlign: 'center',
    paddingHorizontal: 5
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
  },
  paidStatus: {
    color: '#2e7d32',
    fontWeight: 'bold'
  },
  pendingStatus: {
    color: '#f57f17',
    fontWeight: 'bold'
  }
});

// Safe wrapper for the PDF component to catch any rendering errors
const EditFeeModalPDF = ({ student = {}, calculatedFees = {}, showUSD = false, usdRate = null }) => {
  try {
    // Ensure we have valid objects to work with
    const safeStudent = student || {};
    const safeCalculatedFees = calculatedFees || {};
    
    const currentDate = dayjs().format("DD/MM/YYYY");
    
    // Safe formatting functions
    const formatAmount = (amount) => {
      if (amount === null || amount === undefined || isNaN(parseFloat(amount))) return "0.00";
      const numAmount = parseFloat(amount);
      return numAmount.toFixed(2);
    };
    
    // Simplified date formatting function
    const formatDate = (dateInput) => {
      if (!dateInput) return "-";
      try {
        return dayjs(dateInput).format("DD/MM/YYYY");
      } catch (e) {
        return "-";
      }
    };
    
    // Simplified period text function
    const getPeriodText = (startDate, endDate) => {
      if (!startDate || !endDate) return "-";
      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
    };
    
    // Simplified days calculation
    const getDays = (startDate, endDate) => {
      if (!startDate || !endDate) return "-";
      try {
        const days = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'days') + 1);
        return `${days} days`;
      } catch (e) {
        return "-";
      }
    };
    
    // Safely get subjects and installments
    const validSubjects = Array.isArray(safeStudent.subjects) ? 
      safeStudent.subjects.filter(s => s && (typeof s === 'string' || s.name)) : [];
    
    const installments = Array.isArray(safeStudent.feesInstallment) ? 
      safeStudent.feesInstallment : [];
      
    // Ensure calculatedFees is properly structured
    const safeFees = {
      baseAmount: safeCalculatedFees.baseAmount || 0,
      gstAmount: safeCalculatedFees.gstAmount || 0,
      scholarshipAmount: safeCalculatedFees.scholarshipAmount || 0,
      oneToOneAmount: safeCalculatedFees.oneToOneAmount || 0,
      finalTotal: safeCalculatedFees.finalTotal || 0,
      subjectBreakdown: safeCalculatedFees.subjectBreakdown || {}
    };
    
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View>
            <Image 
                src="/inkstallLogo/image.png" 
                style={{ height: 60, width: "auto", marginBottom: 8 }} 
              />
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.bold}>Fee Statement</Text>
              <Text>Date: {currentDate}</Text>
              <Text>Statement #: FEE-{dayjs().format("YYYYMMDD")}-{safeStudent?.name ? safeStudent.name.substring(0, 3).toUpperCase() : "XXX"}</Text>
            </View>
          </View>

          <Text style={styles.currencyNote}>All amounts are in {showUSD ? "USD" : "INR"}</Text>

          {/* Student Details Section */}
          <View style={styles.section}>
            <Text style={styles.title}>Student Details:</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{safeStudent?.name || ""}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Grade:</Text>
              <Text style={styles.value}>{safeStudent?.grade || ""}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Board:</Text>
              <Text style={styles.value}>{safeStudent?.board || ""}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>School:</Text>
              <Text style={styles.value}>{safeStudent?.school || ""}</Text>
            </View>
          </View>

          {/* Fee Configuration */}
          <View style={styles.section}>
            <Text style={styles.title}>Fee Configuration:</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Base Price:</Text>
              <Text style={styles.value}>{formatAmount(safeStudent.feeConfig?.basePrice || 0)}</Text>
            </View>
            {safeStudent.feeConfig?.gstApplied && (
              <View style={styles.row}>
                <Text style={styles.label}>GST Applied:</Text>
                <Text style={styles.value}>Yes ({safeStudent.feeConfig?.gstPercentage || 18}%)</Text>
              </View>
            )}
            {safeStudent.feeConfig?.scholarshipApplied && (
              <View style={styles.row}>
                <Text style={styles.label}>Scholarship Applied:</Text>
                <Text style={styles.value}>Yes ({safeStudent.feeConfig?.scholarshipPercentage || 0}%)</Text>
              </View>
            )}
            {safeStudent.feeConfig?.oneToOneApplied && (
              <View style={styles.row}>
                <Text style={styles.label}>One-to-One Applied:</Text>
                <Text style={styles.value}>Yes ({safeStudent.feeConfig?.oneToOnePercentage || 0}%)</Text>
              </View>
            )}
          </View>

          {/* Subject-wise Fees Table */}
          <View style={styles.table}>
            <Text style={styles.title}>Subject-wise Fees:</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.subjectCol}>Subject</Text>
              <Text style={styles.daysCol}>Period</Text>
              <Text style={styles.amountCol}>Amount</Text>
            </View>
            
            {/* Table Body */}
            <View style={styles.tableBody}>
              {safeFees.subjectBreakdown && Object.keys(safeFees.subjectBreakdown).length > 0 ? (
                Object.entries(safeFees.subjectBreakdown).map(([subjectName, breakdown], index) => {
                  // Find the subject in validSubjects
                  const subject = validSubjects.find(s => 
                    (typeof s === 'object' ? s.name : s) === subjectName
                  );
                  
                  // If subject was deleted, use default values
                  const startDate = subject && typeof subject === 'object' ? subject.startDate : null;
                  const endDate = subject && typeof subject === 'object' ? subject.endDate : null;
                  
                  return (
                    <View key={index.toString()}>
                      <View style={styles.tableRow}>
                        <Text style={styles.subjectCol}>{subjectName}</Text>
                        <Text style={styles.daysCol}>
                          {startDate && endDate ? getDays(startDate, endDate) : "-"}
                        </Text>
                        <Text style={styles.amountCol}>{formatAmount(breakdown?.total || 0)}</Text>
                      </View>
                      {startDate && endDate && (
                        <Text style={styles.periodText}>
                          {getPeriodText(startDate, endDate)}
                        </Text>
                      )}
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
              <Text>Base Amount</Text>
              <Text>{formatAmount(safeFees.baseAmount)}</Text>
            </View>
            
            {(safeFees.scholarshipAmount > 0) && (
              <View style={styles.feeRow}>
                <Text>Scholarship</Text>
                <Text>-{formatAmount(safeFees.scholarshipAmount)}</Text>
              </View>
            )}
            
            {(safeFees.oneToOneAmount > 0) && (
              <View style={styles.feeRow}>
                <Text>One-to-One Additional</Text>
                <Text>{formatAmount(safeFees.oneToOneAmount)}</Text>
              </View>
            )}
            
            {(safeFees.gstAmount > 0) && (
              <View style={styles.feeRow}>
                <Text>GST</Text>
                <Text>{formatAmount(safeFees.gstAmount)}</Text>
              </View>
            )}
            
            <View style={[styles.feeRow, styles.bold]}>
              <Text>Total Amount</Text>
              <Text>{formatAmount(safeFees.finalTotal)}</Text>
            </View>
          </View>

          {/* Payment Schedule Table */}
          <View style={styles.installmentSection}>
            <Text style={styles.title}>Payment Schedule:</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.installmentCol}>Installment</Text>
              <Text style={styles.dateCol}>Due Date</Text>
              <Text style={styles.paidCol}>Paid</Text>
              <Text style={styles.dueCol}>Due Amount</Text>
              <Text style={styles.statusCol}>Status</Text>
            </View>
            
            {/* Table Body */}
            <View style={styles.tableBody}>
              {installments.length > 0 ? (
                installments.map((inst, index) => {
                  const isPaid = inst.paid > 0 && inst.paidDate;
                  const dueAmount = (inst.pay || 0) - (inst.paid || 0);
                  
                  return (
                    <View style={styles.tableRow} key={index.toString()}>
                      <Text style={styles.installmentCol}>Installment {index + 1}</Text>
                      <Text style={styles.dateCol}>{formatDate(inst.dueDate)}</Text>
                      <Text style={styles.paidCol}>{formatAmount(inst.paid || 0)}</Text>
                      <Text style={styles.dueCol}>{formatAmount(dueAmount)}</Text>
                      <Text style={[styles.statusCol, isPaid ? styles.paidStatus : styles.pendingStatus]}>
                        {isPaid ? "Paid" : "Pending"}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.tableRow}>
                  <Text style={styles.installmentCol}>No installments</Text>
                  <Text style={styles.dateCol}>-</Text>
                  <Text style={styles.paidCol}>0.00</Text>
                  <Text style={styles.dueCol}>0.00</Text>
                  <Text style={styles.statusCol}>-</Text>
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
  } catch (error) {
    console.error("Error rendering PDF:", error);
    // Return a minimal document when there's an error
    return (
      <Document>
        <Page size="A4" style={{ padding: 30, fontSize: 12 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 20, marginBottom: 20 }}>Error Generating PDF</Text>
            <Text>There was an error generating the PDF. Please try again later.</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default EditFeeModalPDF;