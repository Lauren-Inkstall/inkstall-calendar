// dailyupdate.controller.js

import DailyUpdate from '../models/dailyupdate.model.js';
import TestSubmission from '../models/testsubmission.model.js'; 
import axios from 'axios';
import dotenv from 'dotenv';
import { addDailyUpdatePoints, addKSheetPoints } from './teacherpoints.controller.js';

dotenv.config();

const NEXTCLOUD_BASE_URL = process.env.NEXTCLOUD_BASE_URL || 'https://drive.inkstall.us';
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

if (!NEXTCLOUD_USERNAME || !NEXTCLOUD_PASSWORD) {
  console.error('❌ Missing Nextcloud credentials.');
  process.exit(1);
}

function encodePath(path) {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

async function ensureFolderExists(folderPath) {
  try {
    const encodedFolderPath = encodePath(folderPath);
    const fullUrl = `${NEXTCLOUD_BASE_URL}/remote.php/dav/files/${encodeURIComponent(NEXTCLOUD_USERNAME)}/${encodedFolderPath}/`;
    await axios({
      method: 'MKCOL',
      url: fullUrl,
      auth: { username: NEXTCLOUD_USERNAME, password: NEXTCLOUD_PASSWORD },
      validateStatus: (status) => status === 201 || status === 405,
    });
    console.log(`✅ Folder ensured: ${folderPath}`);
  } catch (error) {
    console.error(`⚠️ Error ensuring folder: ${folderPath}`, error.response ? error.response.data : error.message);
  }
}

function buildFolderAndFilePath(file, student, subject, fileType) {
  const baseFolder = "Tests and K-Sheets";
  const subjectFolder = subject.trim();
  const typeFolder = fileType === "k-sheet" ? "K-sheet" : "Test Sheet";
  const gradeFolder = student.grade.trim();
  const folderPath = `${baseFolder}/${subjectFolder}/${typeFolder}/${gradeFolder}`;
  const filePath = `${folderPath}/${file.originalname}`;
  return { folderPath, filePath };
}

async function uploadToNextcloud(file, student, subject, fileType) {
  try {
    const { folderPath, filePath } = buildFolderAndFilePath(file, student, subject, fileType);
    const baseFolder = "Tests and K-Sheets";
    await ensureFolderExists(baseFolder);
    await ensureFolderExists(`${baseFolder}/${subject}`);
    await ensureFolderExists(`${baseFolder}/${subject}/${fileType === "k-sheet" ? "K-sheet" : "Test Sheet"}`);
    await ensureFolderExists(`${baseFolder}/${subject}/${fileType === "k-sheet" ? "K-sheet" : "Test Sheet"}/${student.grade.trim()}`);
    const encodedFilePath = encodePath(filePath);
    const fullUrl = `${NEXTCLOUD_BASE_URL}/remote.php/dav/files/${encodeURIComponent(NEXTCLOUD_USERNAME)}/${encodedFilePath}`;
    console.log(`📤 Uploading file to: ${fullUrl}`);
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

export const uploadKSheet = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });
    
    const { dailyUpdateId, testSubmissionId, subjectName, chapterName, fileType } = req.body;
    
    let record;
    let recordType;

    if (dailyUpdateId) {
      record = await DailyUpdate.findById(dailyUpdateId);
      recordType = "dailyUpdate";
      if (!record) {
        return res.status(404).json({ message: "Daily update not found" });
      }
    } else if (testSubmissionId) {
      record = await TestSubmission.findById(testSubmissionId);
      recordType = "testSubmission";
      if (!record) {
        return res.status(404).json({ message: "Test submission not found" });
      }
    } else {
      return res.status(400).json({ message: "No valid record identifier provided" });
    }

    const student = record.students[0];
    if (!student || !student.grade) {
      return res.status(400).json({ message: "Student grade information is missing" });
    }

    const uploadedUrl = await uploadToNextcloud(req.file, student, subjectName, fileType);
    
    if (recordType === "dailyUpdate") {
      record.subjects.forEach(subject => {
        if (subject.name === subjectName) {
          subject.chapters.forEach(chapter => {
            if (chapter.chapterName === chapterName) {
              if (fileType === "k-sheet") {
                chapter.kSheetUrl = uploadedUrl;
              } else {
                chapter.testSubmissionUrl = uploadedUrl;
              }
            }
          });
        }
      });
    } else {
      record.subject.uploadTestFileUrl = uploadedUrl;
    }

    await record.save();
    res.status(200).json({ message: "File uploaded successfully", fileUrl: uploadedUrl });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
};

// Original getDailyUpdates only returns records for the logged-in user
export const getDailyUpdates = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    const updates = await DailyUpdate.find({ createdBy: req.user._id });
    res.status(200).json(updates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New endpoint to return all daily updates for admin or superadmin
export const getAllDailyUpdates = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      const updates = await DailyUpdate.find({});
      res.status(200).json(updates);
    } else {
      const updates = await DailyUpdate.find({ createdBy: req.user._id });
      res.status(200).json(updates);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDailyUpdate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    }
    const dailyUpdate = new DailyUpdate({
      ...req.body, 
      createdBy: req.user._id,
      teacherName: req.user.name
    });
    await dailyUpdate.save();
    
    // Award points for daily update
    const pointsResult = await addDailyUpdatePoints(req.user._id, req.user.name);
    
    // Check if K-Sheet was included and award additional points
    let kSheetPointsResult = null;
    const hasKSheet = dailyUpdate.subjects.some(subject => 
      subject.chapters.some(chapter => chapter.kSheet === 'yes')
    );
    
    if (hasKSheet) {
      kSheetPointsResult = await addKSheetPoints(req.user._id, req.user.name);
    }
    
    // Prepare response with points information
    const pointsInfo = {
      dailyUpdatePoints: pointsResult.pointsAwarded,
      kSheetPoints: kSheetPointsResult ? kSheetPointsResult.pointsAwarded : 0,
      totalPointsEarned: (kSheetPointsResult ? kSheetPointsResult.pointsAwarded : 0) + pointsResult.pointsAwarded,
      totalPoints: kSheetPointsResult ? kSheetPointsResult.totalPoints : pointsResult.totalPoints
    };
    
    res.status(201).json({
      dailyUpdate,
      pointsInfo
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDailyUpdateById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user logged in" });
    }
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid daily update ID format" });
    }
    const existingDailyUpdate = await DailyUpdate.findById(id);
    if (!existingDailyUpdate) {
      return res.status(404).json({ message: "Daily update not found" });
    }
    // Allow update if the user is admin or superadmin OR the owner of the update.
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      existingDailyUpdate.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied: You can only update your own daily updates" });
    }
    if (req.body.createdBy) {
      delete req.body.createdBy;
    }
    const updatedDailyUpdate = await DailyUpdate.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedDailyUpdate);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};