const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create separate folders for different types of uploads
    const type = req.baseUrl.includes('journal') ? 'journals' : 'profiles';
    const typeDir = path.join(uploadDir, type);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// Export different upload configurations
exports.uploadSingle = upload.single('media');
exports.uploadMultiple = upload.array('media', 5);
exports.uploadProfilePicture = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile pictures
  }
}).single('profilePicture'); 

// Helpers
// Generate a URL path for a stored file relative to the public uploads directory
exports.getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  const normalized = relativePath.replace(/\\/g, '/');
  return `/uploads/${normalized.replace(/^\/?uploads\/?/, '')}`;
};

// Delete a file by relative path within the uploads directory
exports.deleteFile = (relativePath) => {
  try {
    if (!relativePath) return;
    const absolutePath = path.join(uploadDir, relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    // Log and continue; callers handle failure gracefully
    console.error('Error deleting file:', err.message);
  }
};