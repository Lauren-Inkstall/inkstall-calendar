import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'teacher', 'student'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    profilePhotoUrl: {
        type: String,
        default: null
    },
    localPhotoUrl: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastLogin: {
        type: String,
        default: null
    },
    createdAt: String,
    updatedAt: String
}, {
    versionKey: false 
});

// Set timestamps before saving
userSchema.pre('save', function(next) {
    const now = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata'
    });
    
    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;