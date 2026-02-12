const { Router } = require("express");
const { fetchMultipleUrlMetadata } = require("../utils/urlMetadata");
const path = require("path");
const fs = require("fs");

const router = Router();

router.get("/status", (req, res) => {
  return res.status(200).send({ user: req.user });
});

// Fetch metadata for URLs
router.post("/fetch-url-metadata", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    // Limit to 10 URLs per request to prevent abuse
    if (urls.length > 10) {
      return res.status(400).json({ error: "Maximum 10 URLs allowed per request" });
    }

    const metadata = await fetchMultipleUrlMetadata(urls);
    return res.status(200).json({ metadata });
  } catch (error) {
    console.error("Error in fetch-url-metadata:", error);
    return res.status(500).json({ error: "Failed to fetch URL metadata" });
  }
});

// Serve broadcast files
router.get("/uploads/broadcasts/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, "../uploads/broadcasts", sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file stats for content-length
    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Set appropriate content-type based on extension
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `inline; filename="${sanitizedFilename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving broadcast file:", error);
    return res.status(500).json({ error: "Failed to serve file" });
  }
});

module.exports = router;
