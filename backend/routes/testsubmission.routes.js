import express from 'express';
import multer from 'multer';
import * as testSubmissionController from "../controllers/testsubmission.controller.js";
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST: Create a test submission
router.post('/',auth, testSubmissionController.createTestSubmission);

// GET: Get all test submissions
router.get('/', auth, testSubmissionController.getTestSubmissions);

router.post(
  "/upload-testfile",
  auth,
  upload.single("file"),
  testSubmissionController.uploadTestFile 
);

export default router;