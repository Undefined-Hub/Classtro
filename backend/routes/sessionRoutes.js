const express = require("express");
const router = express.Router();
const { createPoll, listPolls } = require("../controllers/pollController");
const {
  createSessionStandalone,
  getSessionByCode,
  getSessionById,
  listActiveSessions,
  closeSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
  getSessionParticipants,
  getParticipantById,
  kickParticipant,
  monitorSessions,
} = require("../controllers/sessionController");
const {
  addBroadcast,
  getBroadcasts,
  deleteBroadcast,
  addReaction,
  trackView,
} = require("../controllers/broadcastController");
const authenticateJWT = require("../middlewares/authenticateJWT");
const {
  uploadBroadcastFiles,
  handleBroadcastUploadError,
} = require("../config/multer");

// ---------------- PUBLIC / SHARED ROUTES ----------------
router.get("/code/:code", getSessionByCode); // Get session metadata by join code (public, for join UI) ✅
router.get("/monitor", monitorSessions); // Monitor active sessions (teacher only)
router.get("/active", listActiveSessions); // List active sessions (global / filters by ?teacherId, ?roomId)✅

// ---------------- TEACHER ROUTES ----------------
router.post("/", authenticateJWT, createSessionStandalone); // Create a session (standalone, no room) ✅
router.get("/id/:sessionId", authenticateJWT, getSessionById); // Get session details by sessionId (teacher only)✅
router.patch("/id/:sessionId", authenticateJWT, updateSession); // Update session metadata (teacher only)✅
router.post("/code/:code/close", authenticateJWT, closeSession); // Close a session (teacher only) ✅
router.delete("/id/:sessionId", authenticateJWT, deleteSession); // Delete a session (teacher only) - same as closing for now, can be extended later with a 'soft delete' field if needed

// ---------------- STUDENT ROUTES ----------------
router.post("/code/:code/join", authenticateJWT, joinSession); // Student joins a session✅
router.post("/code/:code/leave", authenticateJWT, leaveSession); // Student leaves a session
router.post("/code/:code/kick", authenticateJWT, kickParticipant); // Teacher kicks a student from session
router.get("/code/:code/participants", authenticateJWT, getSessionParticipants); // Get participants of a session (teacher only)
router.get("/participants/:participantId", authenticateJWT, getParticipantById); // Get individual participant record

router.post("/:sessionId/polls", authenticateJWT, createPoll); // Create a poll in a session (teacher only)
router.get("/:sessionId/polls", authenticateJWT, listPolls); // List all polls in a session (teacher only)

// ---------------- BROADCAST / ANNOUNCEMENT ROUTES ----------------
router.post(
  "/:sessionId/broadcasts",
  authenticateJWT,
  uploadBroadcastFiles,
  handleBroadcastUploadError,
  addBroadcast,
); // Send broadcast with optional files (teacher only)
router.get("/:sessionId/broadcasts", authenticateJWT, getBroadcasts); // Get all broadcasts for a session
router.delete(
  "/:sessionId/broadcasts/:broadcastId",
  authenticateJWT,
  deleteBroadcast,
); // Delete a broadcast (teacher only)
router.post(
  "/:sessionId/broadcasts/:broadcastId/react",
  authenticateJWT,
  addReaction,
); // Add/toggle reaction to broadcast
router.post(
  "/:sessionId/broadcasts/:broadcastId/view",
  authenticateJWT,
  trackView,
); // Track broadcast view

module.exports = router;
