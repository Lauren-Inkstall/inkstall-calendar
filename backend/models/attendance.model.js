import mongoose from 'mongoose';

// Function to format date and time as "M/D/YYYY, H:MM:SS AM/PM"
function formatDateTime(date) {
    if (!date) return null;
    return new Date(date).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

const attendanceSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    date: {
        type: String,
        required: true,
        set: function(val) {
            return formatDateTime(val);
        }
    },
    punchIn: {
        time: {
            type: String,
            set: function(val) {
                return formatDateTime(val);
            }
        },
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    },
    punchOut: {
        time: {
            type: String,
            set: function(val) {
                return formatDateTime(val);
            }
        },
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    },
    workingHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['inprogress', 'present', 'absent', 'leave','auto-punched-out'],
        default: 'inprogress'
    }
}, {
    versionKey: false // This will remove the __v field
});

// Calculate working hours before saving
attendanceSchema.pre('save', function(next) {
    if (this.punchIn && this.punchOut && this.punchOut.time) {
        const punchInTime = new Date(this.punchIn.time);
        const punchOutTime = new Date(this.punchOut.time);
        
        // Calculate hours difference
        const diffHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
        this.workingHours = parseFloat(diffHours.toFixed(2));
        
        // Update status to present only when there's a punch-out
        if(this.status !== 'auto-punched-out'){
        this.status = 'present';
    }
        
    }
    next();
});

// Add virtual properties for formatted times
attendanceSchema.virtual('formattedPunchIn').get(function() {
    return this.punchIn && this.punchIn.time ? this.punchIn.time : null;
});

attendanceSchema.virtual('formattedPunchOut').get(function() {
    return this.punchOut && this.punchOut.time ? this.punchOut.time : null;
});

// Add virtual property for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
    return this.date;
});

// Ensure virtuals are included in JSON
attendanceSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;