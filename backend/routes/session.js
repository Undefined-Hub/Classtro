const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

router.post("/create", (req, res) => {
  const sessionId = uuidv4(); // can also generate short one
  const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

  // For now, just return it. You can later store in DB.
  res.json({
    sessionId,
    roomCode,
    createdAt: new Date(),
  });
});

module.exports = router;
