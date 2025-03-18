import TestSubmission from '../models/testsubmission.model.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { addTestPoints } from './teacherpoints.controller.js';

dotenv.config();

// Nextcloud configuration
const NEXTCLOUD_BASE_URL = process.env.NEXTCLOUD_BASE_URL || 'https://drive.inkstall.us';
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

// Ensure Nextcloud credentials exist.
if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) {
  console.error('❌ Missing Nextcloud credentials.');
  process.exit(1);
}

/**
 * Encode each segment of a path so that slashes are preserved.
 * Each segment is URL encoded separately.
 * This prevents the entire path from being encoded (which would
 * convert "/" to "%2F" and break the folder structure).
 *
 * @param {string} path - The path string (e.g., "Tests and K-Sheets/Math/Test Sheet/Sr Kg/file.pdf")
 * @returns {string} - The properly encoded path.
 */
function encodePath(path) {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

/**
 * Ensure that a folder exists in Nextcloud.
 * Sends a MKCOL request to create the folder. If the folder already exists,
 * Nextcloud returns a 405 and we ignore that.
 *
 * @param {string} folderPath - The folder path relative to the user's Nextcloud files.
 */
async function ensureFolderExists(folderPath) {
  try {
    // Encode each segment so that the "/" characters remain intact.
    const encodedFolderPath = encodePath(folderPath);
    const fullUrl = `${NEXTCLOUD_BASE_URL}/remote.php/dav/files/${encodeURIComponent(NEXTCLOUD_USERNAME)}/${encodedFolderPath}/`;
    await axios({
      method: 'MKCOL',
      url: fullUrl,
      auth: { username: NEXTCLOUD_USERNAME, password: NEXTCLOUD_PASSWORD },
      validateStatus: (status) => status === 201 || status === 405, // 201 Created or 405 Already Exists.
    });
    console.log(`✅ Folder ensured: ${folderPath}`);
  } catch (error) {
    console.error(`⚠️ Error ensuring folder: ${folderPath}`, error.response ? error.response.data : error.message);
  }
}

/**
 * Build the folder and file path using the following structure:
 *
 * Tests and K-Sheets / [subject] / [type folder: "K-sheet" or "Test Sheet"] / [grade] / [filename]
 *
 * @param {object} file - The file object from multer.
 * @param {object} student - The student object (used to extract the grade).
 * @param {string} subject - The subject name.
 * @param {string} fileType - Either "k-sheet" or "test-sheet".
 * @returns {object} - An object with folderPath and filePath.
 */
function buildFolderAndFilePath(file, student, subject, fileType) {
  const baseFolder = "Tests and K-Sheets"; // Main base folder.
  const subjectFolder = subject.trim();    // E.g., "Math" or "Sciences".
  // Decide folder based on file type.
  const typeFolder = fileType === "k-sheet" ? "K-sheet" : "Test Sheet";
  const gradeFolder = student.grade.trim();  // E.g., "Sr Kg", "Jr KG", etc.
  // Full folder path without the file name.
  const folderPath = `${baseFolder}/${subjectFolder}/${typeFolder}/${gradeFolder}`;
  // Append file name.
  const filePath = `${folderPath}/${file.originalname}`;
  return { folderPath, filePath };
}

/**
 * Upload the file to Nextcloud under the correct folder structure.
 * This function first ensures that all folder levels exist,
 * then uploads the file using a PUT request.
 *
 * @param {object} file - The file object (from multer).
 * @param {object} student - The student object (to extract grade).
 * @param {string} subject - The subject name.
 * @param {string} fileType - "k-sheet" or "test-sheet".
 * @returns {string} - The full URL of the uploaded file.
 */
async function uploadToNextcloud(file, student, subject, fileType) {
  try {
    const { folderPath, filePath } = buildFolderAndFilePath(file, student, subject, fileType);

    // Recursively ensure that each level of the folder structure exists.
    const baseFolder = "Tests and K-Sheets";
    await ensureFolderExists(baseFolder);
    await ensureFolderExists(`${baseFolder}/${subject}`);
    await ensureFolderExists(`${baseFolder}/${subject}/${fileType === "k-sheet" ? "K-sheet" : "Test Sheet"}`);
    await ensureFolderExists(`${baseFolder}/${subject}/${fileType === "k-sheet" ? "K-sheet" : "Test Sheet"}/${student.grade.trim()}`);

    // Encode the full file path correctly.
    const encodedFilePath = encodePath(filePath);
    const fullUrl = `${NEXTCLOUD_BASE_URL}/remote.php/dav/files/${encodeURIComponent(NEXTCLOUD_USERNAME)}/${encodedFilePath}`;

    console.log(`📤 Uploading file to: ${fullUrl}`);

    // Upload the file using an HTTP PUT request.
    await axios({
      method: 'PUT',
      url: fullUrl,
      data: file.buffer,
      headers: {
        Authorization: `Basic ${Buffer.from(`${NEXTCLOUD_USERNAME}:${NEXTCLOUD_PASSWORD}`).toString('base64')}`,
        'Content-Type': file.mimetype,
        'Content-Length': file.size,
      },
      validateStatus: (status) => status === 201 || status === 204,
    });

    return fullUrl;
  } catch (error) {
    console.error('❌ Nextcloud Upload Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Endpoint to upload a test file for a Test Submission.
 * Expects the following in req.body:
 *   - testSubmissionId: the MongoDB ID of the TestSubmission record.
 *   - subjectName: the subject (used to build the path).
 *   - chapterName: the chapter name (for record update, if needed).
 *   - fileType: should be "test-sheet" (for Test Submission uploads).
 *
 * It also expects a file to be uploaded via multer (req.file).
 *
 * After a successful upload, it updates the TestSubmission record's
 * subject.uploadTestFileUrl field with the URL of the uploaded file.
 */
export const uploadTestFile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { testSubmissionId, subjectName, chapterName, fileType } = req.body;
    // Find the test submission record by its ID.
    const testSubmission = await TestSubmission.findById(testSubmissionId);
    if (!testSubmission) {
      return res.status(404).json({ message: "Test submission not found" });
    }

    // Use the first student from the submission to determine the grade.
    const student = testSubmission.students[0];
    if (!student || !student.grade) {
      return res.status(400).json({ message: "Student grade information is missing" });
    }

    // Upload the file to Nextcloud.
    const uploadedUrl = await uploadToNextcloud(req.file, student, subjectName, fileType);

    // Update the TestSubmission record with the uploaded file URL.
    // In our TestSubmission model, we store the test file URL in subject.uploadTestFileUrl.
    testSubmission.subject.uploadTestFileUrl = uploadedUrl;

    await testSubmission.save();

    res.status(200).json({ message: "File uploaded successfully", fileUrl: uploadedUrl });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
};

/**
 * Create a new Test Submission.
 * This endpoint receives test submission details and creates a record
 * using the TestSubmission model.
 */
export const createTestSubmission = async (req, res) => {
  try {
      console.log("Received data:", JSON.stringify(req.body, null, 2));

      // Ensure subject fields are properly set
      const submissionData = {
          submissionDate: req.body.submissionDate || new Date(),
          proposedDate: req.body.proposedDate,
          branch: req.body.branch,
          totalMarks: req.body.totalMarks,
          createdBy: req.body.createdBy || (req.user ? req.user._id : null),
          teacherName: req.body.teacherName || (req.user ? req.user.name : null),
          email: req.body.email || (req.user ? req.user.email : null),
          students: req.body.students || [],
          subject: {
              name: req.body.subject.name,
              chapters: req.body.subject.chapters || [],
              notes: req.body.subject.notes || "No notes provided",
              uploadTestFileUrl: req.body.subject.uploadTestFileUrl || "No file uploaded"
          }
      };

      // Validate that createdBy is provided
      if (!submissionData.createdBy) {
          return res.status(400).json({ message: "Teacher ID (createdBy) is required" });
      }

      // Validate that teacherName is provided
      if (!submissionData.teacherName) {
          return res.status(400).json({ message: "Teacher name is required" });
      }

      // Validate that email is provided
      if (!submissionData.email) {
          return res.status(400).json({ message: "Email is required" });
      }

      console.log("Modified data to save:", JSON.stringify(submissionData, null, 2));

      const newSubmission = new TestSubmission(submissionData);
      const savedSubmission = await newSubmission.save();

      console.log("Saved submission:", JSON.stringify(savedSubmission.toObject(), null, 2));
      
      // Award points for test submission based on marks
      const pointsResult = await addTestPoints(
        submissionData.createdBy,
        submissionData.teacherName,
        submissionData.totalMarks
      );
      
      // Prepare response with points information
      const pointsInfo = {
        testPoints: pointsResult.pointsAwarded,
        totalPoints: pointsResult.totalPoints
      };
      
      res.status(201).json({
        testSubmission: savedSubmission,
        pointsInfo
      });
  } catch (error) {
      console.error("Error creating test submission:", error);
      res.status(400).json({ message: error.message });
  }
};

// Get all test submissions
export const getTestSubmissions = async (req, res) => {
  try {
      // Check if user is authenticated
      if (!req.user) {
          return res.status(401).json({ message: "Unauthorized: No user logged in" });
      }

      let submissions;
      
      // If user is admin or superadmin, show all submissions
      if (['admin', 'superadmin',].includes(req.user.role)) {
          submissions = await TestSubmission.find();
      } else {
          // For regular teachers, only show their own submissions
          submissions = await TestSubmission.find({ createdBy: req.user._id });
      }
      
      res.json(submissions);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};