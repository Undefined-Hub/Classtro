const { Router } = require("express");
const authRoutes = require("./authRoutes");
const utilRoutes = require("./utilRoutes");
const roomRoutes = require("./roomRoutes");
const authenticateJWT = require("../middlewares/authenticateJWT");
const sessionRoutes = require("./sessionRoutes");
const qnaRoutes = require("./qnaRoutes");
const pollRoutes = require("./pollRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const sessionFeedbackRoutes = require("./sessionFeedbackRoutes");
const userRoutes = require("./userRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/users", authenticateJWT, userRoutes);
router.use("/api/util", authenticateJWT, utilRoutes);
router.use("/api/rooms", authenticateJWT, roomRoutes);
router.use("/api/sessions", sessionRoutes);
router.use("/api/sessions", sessionFeedbackRoutes); // Session feedback routes
router.use("/api/questions", authenticateJWT, qnaRoutes);
router.use("/api/polls", pollRoutes);
router.use("/api/feedback", feedbackRoutes);
router.use("/api/analytics", authenticateJWT, analyticsRoutes);
module.exports = router;
