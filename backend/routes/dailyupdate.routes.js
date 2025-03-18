// dailyupdate.routes.js

import express from "express";
import multer from "multer";
import { 
  createDailyUpdate, 
  getDailyUpdates, 
  getAllDailyUpdates, 
  uploadKSheet, 
  updateDailyUpdateById 
} from "../controllers/dailyupdate.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", auth, createDailyUpdate);
// Endpoint for normal users:
router.get("/", auth, getDailyUpdates);
// Endpoint for admin/superadmin to fetch all records:
router.get("/all", auth, getAllDailyUpdates);

router.post(
  "/upload-ksheet",
  auth,
  upload.single("file"),
  uploadKSheet
);

router.patch('/:id', auth, updateDailyUpdateById);

export default router;
