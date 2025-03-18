import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import {setupModelSync} from './middleware/databaseSync.js';
import corsOptions from './config/cors.js';
import routes from './routes/index.routes.js';
import authRoutes from './routes/auth.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import studentRoutes from './routes/student.routes.js';
import leaveRequestRoutes from './routes/leaveRequest.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import dailyUpdateRoutes from './routes/dailyupdate.routes.js';
import testSubmissionRoutes from './routes/testsubmission.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import boardRoutes from './routes/board.routes.js';
import gradesRoutes from './routes/grades.routes.js';
import branchRoutes from './routes/branch.routes.js';
import createformRoutes from './routes/createform.routes.js';
import uploadRoutes from './routes/upload.routes.js'; // Import photo route
// import nextcloudRoutes from './routes/nextcloud-routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import studentPerformanceRoutes from './routes/studentperformance.routes.js';
import teacherPointsRoutes from './routes/teacherpoints.routes.js';
import broadcastRoutes from './routes/broadcast.routes.js';

// Initialize dotenv
dotenv.config();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set a fixed port
const PORT = 4000;

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

// Middleware
app.use(cors(corsOptions));
// Increase JSON payload limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Connect to MongoDB
connectDB().then(() => {
    // Set up model synchronization
    setupModelSync();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/test-submissions', testSubmissionRoutes);
app.use('/api/student-performance', studentPerformanceRoutes);
app.use('/api/create-form', createformRoutes);
app.use('/api/teacher-points', teacherPointsRoutes);
app.use('/api', subjectsRoutes);
app.use('/api', boardRoutes);
app.use('/api', gradesRoutes);
app.use('/api', branchRoutes);
app.use('/api/upload', uploadRoutes); 
app.use('/api/broadcast', broadcastRoutes);
app.use ('/api', routes);

app.use('/', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.PORT || 4000,'0.0.0.0', () => {
    console.log('Server is running');
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    server.close(() => {
        process.exit(1);
    });
});