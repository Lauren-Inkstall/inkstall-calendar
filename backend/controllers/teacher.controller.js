import mongoose from 'mongoose';
import Teacher from '../models/teacher.model.js';
import User from '../models/user.model.js';
import Attendance from '../models/attendance.model.js';

const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata'
    });
};

const generateRandomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };
  
  // Helper function to check if a color is already used by another teacher
  const isColorUnique = async (color) => {
    const existingTeacher = await Teacher.findOne({ color });
    return !existingTeacher;
  };
  
  // Helper function to get a unique color
  const getUniqueColor = async () => {
    let color;
    let isUnique = false;
    
    // Define a set of vibrant colors as fallbacks
    const predefinedColors = [
      '#4285F4', '#EA4335', '#34A853', '#FBBC05', '#8E24AA', 
      '#FF9800', '#009688', '#E91E63', '#3F51B5', '#00BCD4',
      '#FF5722', '#795548', '#607D8B', '#9C27B0', '#673AB7'
    ];
    
    // Try up to 20 times to find a unique random color
    for (let i = 0; i < 20; i++) {
      color = generateRandomColor();
      isUnique = await isColorUnique(color);
      if (isUnique) break;
    }
    
    // If we couldn't find a unique random color, use a predefined one with a slight variation
    if (!isUnique) {
      for (const baseColor of predefinedColors) {
        // Add a slight variation to the predefined color
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // Adjust each color component slightly
        const newR = Math.min(255, Math.max(0, r + Math.floor(Math.random() * 40) - 20));
        const newG = Math.min(255, Math.max(0, g + Math.floor(Math.random() * 40) - 20));
        const newB = Math.min(255, Math.max(0, b + Math.floor(Math.random() * 40) - 20));
        
        color = '#' + 
          newR.toString(16).padStart(2, '0') + 
          newG.toString(16).padStart(2, '0') + 
          newB.toString(16).padStart(2, '0');
        
        isUnique = await isColorUnique(color);
        if (isUnique) break;
      }
    }
    
    return color;
  };
  
  export const createTeacherProfile = async (userData, additionalData) => {
      try {
          if (!userData || !userData._id) {
              throw new Error('User data is required');
          }
  
          const { subjects, aboutMe, workingHours, salary } = additionalData || {};
  
          // Generate a unique color for the teacher if not provided
          let color = additionalData.color;
          if (!color) {
            color = await getUniqueColor();
          } else {
            // If color is provided, check if it's unique
            const isUnique = await isColorUnique(color);
            if (!isUnique) {
              // If not unique, generate a new one
              color = await getUniqueColor();
            }
          }
  
          const teacher = new Teacher({
              teacherId: userData._id,
              teacherName: userData.name,
              emailId: userData.email,
              startingDate: formatDate(new Date()),
              subjects,
              aboutMe,
              workingHours,
              salary,
              color
          });
  
          await teacher.save();
          return teacher;
      } catch (error) {
          throw error;
      }
  };


export const getTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.params.id;
        if (!teacherId) {
            return res.status(400).json({ error: 'Teacher ID is required' });
        }

        const teacher = await Teacher.findOne({ teacherId });
        
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }

        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ error: 'Failed to fetch teacher profile' });
    }
};

export const updateTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.params.id;
        if (!teacherId) {
            return res.status(400).json({ error: 'Teacher ID is required' });
        }

        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        // Remove profile photo handling as it's now in the user model
        if (updates.profilePhoto) {
            delete updates.profilePhoto;
        }

        const teacher = await Teacher.findOneAndUpdate(
            { teacherId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }

        res.json(teacher);
    } catch (error) {
        console.error('Error updating teacher profile:', error);
        res.status(500).json({ 
            error: 'Failed to update teacher profile',
            details: error.message
        });
    }
};

// Get all teachers
export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({}, {
            teacherId: 1,
            teacherName: 1,
            emailId: 1,
            subjects: 1,
            color: 1
        });
        
        res.json(teachers);
    } catch (error) {
        console.error('Error fetching all teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};

// Delete teacher profile
export const deleteTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.params.id;
        if (!teacherId) {
            return res.status(400).json({ error: 'Teacher ID is required' });
        }

        // First check if teacher exists
        const teacherExists = await Teacher.findOne({ teacherId });
        if (!teacherExists) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Delete teacher profile
            await Teacher.findOneAndDelete({ teacherId }).session(session);
            
            // Delete user account using the teacherId (which is the user's _id)
            const deletedUser = await User.findByIdAndDelete(teacherId).session(session);
            if (!deletedUser) {
                throw new Error('Failed to delete user account');
            }

            // Delete attendance records
            await Attendance.deleteMany({ teacherId }).session(session);

            // Commit the transaction
            await session.commitTransaction();
            
            res.json({ 
                message: 'Teacher and user records deleted successfully'
            });
        } catch (error) {
            // If any operation fails, abort the transaction
            await session.abortTransaction();
            throw error;
        } finally {
            // End the session
            session.endSession();
        }
        
    } catch (error) {
        console.error('Error deleting teacher profile:', error);
        res.status(500).json({ 
            error: 'Failed to delete teacher and user records',
            details: error.message
        });
    }
};