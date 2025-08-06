const multer = require('multer');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
  }
});

// Middleware for handling media uploads
exports.handleMediaUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const media = [];
    for (const file of req.files) {
      try {
        // Create a buffer from the file
        const result = await uploadToCloudinary(file.buffer);
        media.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          filename: file.originalname,
          size: file.size
        });
      } catch (error) {
        console.error('Media upload error:', error);
        // Continue with other files if one fails
      }
    }

    req.uploadedMedia = media;
    next();
  } catch (error) {
    console.error('Media upload middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing media files'
    });
  }
};

exports.uploadMiddleware = upload.array('media', 5);
