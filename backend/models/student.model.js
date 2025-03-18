import mongoose from 'mongoose';

// Address schema
const addressSchema = new mongoose.Schema({
    area: { type: String, required: true },
    landmark: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
}, { _id: false });

// Contact information schema
const contactInfoSchema = new mongoose.Schema({
    number: { type: String, required: true },
    relation: { type: String, required: true, enum: ['father', 'mother', 'guardian'] },
    relationName: { type: String, required: true },
    educationQualification: { type: String, required: true },
    nameOfOrganisation: { type: String, required: true },
    designation: { type: String, required: true },
    Department: { type: String, required: true },
    parentPhotoUrl: { type: String, default: null }
}, { _id: false });

// Fee config schema
const feeConfigSchema = new mongoose.Schema({
    basePrice: { type: Number, required: true },
    gstApplied: { type: Boolean, default: false },
    gstPercentage: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    scholarshipApplied: { type: Boolean, default: false },
    scholarshipPercentage: { type: Number, default: 0 },
    scholarshipAmount: { type: Number, default: 0 },
    oneToOneApplied: { type: Boolean, default: false },
    oneToOnePercentage: { type: Number, default: 0 },
    oneToOneAmount: { type: Number, default: 0 },
    baseAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
}, { _id: false });

// Fees Installment schema
const feesInstallmentSchema = new mongoose.Schema({
    pay: { type: Number, required: true }, // Amount to be paid for this installment
    paid: { type: Number, default: 0 }, // Amount actually paid
    dueDate: { type: Date, required: true }, // Due date for this installment
    paidDate: { type: Date, default: null }, // Date when payment was made
    paymentType: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'], default: 'cash' }, // Type of payment
    paymentNotes: { type: String, default: '' } // Additional notes about the payment
}, { _id: true });

// Subject schema
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    total: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
}, { _id: true });

// Main student schema
const studentSchema = new mongoose.Schema({
    studentId: { type: String, unique: true, required: true },
    studentName: { type: String, required: true },
    grade: { type: String, required: true },
    branch: { type: String, required: true },
    school: { type: String, required: true },
    academicYear: { type: String, required: true },
    status: { type: String, required: true, enum: ['admissiondue', 'active', 'inactive', 'completed'], default: 'admissiondue' },
    address: { type: addressSchema, required: true },
    contactInformation: { type: [contactInfoSchema], required: true, validate: [arr => arr.length > 0, 'At least one contact is required'] },
    feeConfig: { type: feeConfigSchema, required: true },
    feesInstallment: { type: [feesInstallmentSchema], default: [] }, // Array of fee installments
    studentPhotoUrl: { type: String, default: null },
    board: { type: String, required: true, uppercase: true },
    subjects: { type: [subjectSchema], default: [] }
}, { 
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Function to generate student ID
studentSchema.statics.generateStudentId = async function(board, grade) {
    try {
        const boardPrefix = board.toUpperCase();
        const paddedGrade = grade.toString().padStart(2, '0');
        
        const latestStudent = await this.findOne({ board: boardPrefix, grade: grade }).sort({ studentId: -1 });
        let nextNumber = 1;
        if (latestStudent && latestStudent.studentId) {
            const matches = latestStudent.studentId.match(/(\d+)$/);
            if (matches) {
                nextNumber = parseInt(matches[1]) + 1;
            }
        }
        return `${boardPrefix}-${paddedGrade}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating student ID:', error);
        throw error;
    }
};

const Student = mongoose.model('Student', studentSchema);
export default Student;