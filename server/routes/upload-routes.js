import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { requireAdminAuth } from '../middleware/admin-basic-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'storage', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'image';
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext.toLowerCase()}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const uploadSingleImage = upload.single('image');

// Upload endpoint for Quill
router.post('/image', requireAdminAuth, (req, res) => {
  uploadSingleImage(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large (max 5MB)' });
      }

      return res.status(400).json({ error: error.message });
    }

    if (error) {
      return res.status(400).json({ error: error.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return URL relative to server root for Quill to use
    // Quill expects { success: true, data: { url: 'path/to/image' } }
    const imageUrl = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  });
});

export default router;
