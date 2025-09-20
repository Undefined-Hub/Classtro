const express = require("express");
const router = express.Router();

const {
  createSessionStandalone,
  getSessionByCode,
  getSessionById,
  listActiveSessions,
  closeSession,
  updateSession,
  joinSession,
  leaveSession,
  getSessionParticipants,
  getParticipantById,
  monitorSessions,
} = require("../controllers/sessionController");
const authenticateJWT = require("../middlewares/authenticateJWT");

// ---------------- PUBLIC / SHARED ROUTES ----------------
router.get("/code/:code", getSessionByCode); // Get session metadata by join code (public, for join UI) ✅
router.get("/monitor", monitorSessions); // Monitor active sessions (teacher only)
router.get("/active", listActiveSessions); // List active sessions (global / filters by ?teacherId, ?roomId)✅

// ---------------- TEACHER ROUTES ----------------
router.post("/", authenticateJWT, createSessionStandalone); // Create a session (standalone, no room) ✅
router.get("/id/:sessionId", authenticateJWT, getSessionById); // Get session details by sessionId (teacher only)✅
router.patch("/id/:sessionId", authenticateJWT, updateSession); // Update session metadata (teacher only)✅
router.post("/code/:code/close", authenticateJWT, closeSession); // Close a session (teacher only) ✅

// ---------------- STUDENT ROUTES ----------------
router.post("/code/:code/join", authenticateJWT, joinSession); // Student joins a session✅
router.post("/code/:code/leave", authenticateJWT, leaveSession); // Student leaves a session
router.get("/code/:code/participants", authenticateJWT, getSessionParticipants); // Get participants of a session (teacher only)
router.get("/participants/:participantId", authenticateJWT, getParticipantById); // Get individual participant record

module.exports = router;
