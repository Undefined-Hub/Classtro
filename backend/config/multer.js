const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/screenshots");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "screenshot-" + uniqueSuffix + ext);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware for single screenshot upload
const uploadScreenshot = upload.single("screenshot");

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 5MB.",
        code: "FILE_TOO_LARGE",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: 'Unexpected file field. Use "screenshot" as field name.',
        code: "UNEXPECTED_FILE_FIELD",
      });
    }
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({
      error: "Only image files are allowed (jpg, png, gif, etc.)",
      code: "INVALID_FILE_TYPE",
    });
  }

  next(error);
};

// ==================== BROADCAST FILE UPLOADS ====================

// Create broadcasts uploads directory
const broadcastsDir = path.join(__dirname, "../uploads/broadcasts");
if (!fs.existsSync(broadcastsDir)) {
  fs.mkdirSync(broadcastsDir, { recursive: true });
}

// Configure multer for broadcast file uploads (PDF, PPT, Images)
const broadcastStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, broadcastsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `broadcast-${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter for broadcast files (PDF, PPT, PPTX, Images)
const broadcastFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, PPT, PPTX, and images are allowed!",
      ),
      false,
    );
  }
};

// Configure multer for broadcast files
const broadcastUpload = multer({
  storage: broadcastStorage,
  fileFilter: broadcastFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 3, // Maximum 3 files per broadcast
  },
});

// Middleware for multiple broadcast file uploads
const uploadBroadcastFiles = broadcastUpload.array("files", 3);

// Error handling middleware for broadcast file uploads
const handleBroadcastUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 10MB per file.",
        code: "FILE_TOO_LARGE",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files. Maximum 3 files per broadcast.",
        code: "TOO_MANY_FILES",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: 'Unexpected file field. Use "files" as field name.',
        code: "UNEXPECTED_FILE_FIELD",
      });
    }
  }

  if (error.message && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      error:
        "Invalid file type. Only PDF, PPT, PPTX, and images (JPG, PNG, GIF, WebP) are allowed.",
      code: "INVALID_FILE_TYPE",
    });
  }

  next(error);
};

module.exports = {
  uploadScreenshot,
  handleUploadError,
  uploadBroadcastFiles,
  handleBroadcastUploadError,
};
