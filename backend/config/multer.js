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

module.exports = {
  uploadScreenshot,
  handleUploadError,
};
