import express from 'express';
import multer from 'multer';
import { createClient } from 'webdav';
import fs from 'fs';
import path from 'path';
import { auth } from '../middleware/auth.middleware.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Get current file directory name with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        cb(null, fileName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

// Normalize NextCloud URL by removing trailing slashes
const normalizeUrl = (url) => url.replace(/\/+$/, '');

// Basic auth credentials
const getBasicAuthHeader = () => {
    const credentials = `${process.env.NEXTCLOUD_USERNAME}:${process.env.NEXTCLOUD_PASSWORD}`;
    return 'Basic ' + Buffer.from(credentials).toString('base64');
};

// Configure WebDAV client
const createWebDAVClient = () => {
    const baseURL = normalizeUrl(process.env.NEXTCLOUD_URL);
    console.log('WebDAV Base URL:', baseURL); // For debugging

    return createClient(
        `${baseURL}/remote.php/dav/files/${encodeURIComponent(process.env.NEXTCLOUD_USERNAME)}/`,
        {
            headers: {
                'Authorization': getBasicAuthHeader(),
                'OCS-APIRequest': 'true'
            }
        }
    );
};

// Upload endpoint
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.file;
        const fileName = file.filename;
        const filePath = file.path;
        const remotePath = `Photos/${fileName}`;
        
        // Get server domain and construct local URL
        const protocol = req.protocol;
        const host = req.get('host');
        const localUrl = `${protocol}://${host}/uploads/${fileName}`;

        // Create a new client instance for this request
        const client = createWebDAVClient();

        // Test connection first
        try {
            const testResponse = await client.getDirectoryContents('/');
            console.log('Connection test successful');
        } catch (testError) {
            console.error('Connection test failed:', testError);
            throw new Error(`NextCloud connection failed: ${testError.message}`);
        }

        // First check if Photos directory exists
        try {
            const exists = await client.exists('Photos');
            if (!exists) {
                console.log('Creating Photos directory...');
                await client.createDirectory('Photos');
            }
        } catch (dirError) {
            console.error('Directory check/creation error:', dirError);
            // Continue anyway as the directory might exist
        }

        // Upload file to NextCloud
        try {
            console.log('Uploading to path:', remotePath);
            
            // Read file from disk
            const fileBuffer = fs.readFileSync(filePath);
            
            // Add explicit content type and length headers
            await client.putFileContents(remotePath, fileBuffer, {
                contentLength: file.size,
                overwrite: true,
                headers: {
                    'Content-Type': file.mimetype,
                    'Content-Length': file.size.toString()
                }
            });

            // Generate NextCloud URL
            const nextCloudUrl = `${normalizeUrl(process.env.NEXTCLOUD_URL)}/remote.php/webdav/Photos/${encodeURIComponent(fileName)}`;

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                localUrl: localUrl,
                nextCloudUrl: nextCloudUrl,
                fileName: fileName
            });
        } catch (uploadError) {
            console.error('Upload error details:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message
        });
    }
});

export default router;