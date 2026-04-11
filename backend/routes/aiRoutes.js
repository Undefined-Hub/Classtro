const { Router } = require("express");
const { generateQuiz } = require("../controllers/aiController");

const express = require("express");
const {
  handleChatRequest,
  handleInsightsRequest,
  handleHealthCheck,
} = require("../controllers/aiController");
const authenticateJWT = require("../middlewares/authenticateJWT");
const optionalAuthJWT = require("../middlewares/optionalAuthJWT");

const router = express.Router();

router.get("/health", handleHealthCheck);
router.post("/chat", optionalAuthJWT, handleChatRequest); // Allow both authenticated and guest users
router.post("/insights", authenticateJWT, handleInsightsRequest); // Requires authentication

router.post("/generate-quiz", generateQuiz);

module.exports = router;
