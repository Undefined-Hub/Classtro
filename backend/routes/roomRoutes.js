const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middlewares/authenticateJWT");
// const { authTeacher } = require("../middleware/authMiddleware");
const {
  createRoom,
  listRooms,
  getRoomById,
  updateRoom,
  archiveRoom,
  unarchiveRoom,
  getArchivedRoomsByUserId,
  hardDeleteRoom,
  listRoomSessions,
} = require("../controllers/roomController");

const { createSessionInRoom } = require("../controllers/sessionController");
// --- Teacher routes ---
router.post("/", createRoom); // Create a new room
router.get("/", listRooms); // List teacher's rooms (paginated)
router.get("/:roomId", getRoomById); // Get single room details
router.patch("/:roomId", updateRoom); // Update room metadata
router.put("/:roomId", archiveRoom); // Archive / soft-delete a room
router.patch("/:roomId/unarchive", unarchiveRoom); // Unarchive a room
router.get("/:userId/archives", authenticateJWT, getArchivedRoomsByUserId); // List archived rooms for a user
router.delete("/:roomId/hard", hardDeleteRoom); // Permanently delete a room
router.get("/:roomId/sessions", listRoomSessions); // List sessions of a room
router.post("/:roomId/sessions", createSessionInRoom); // Create a session under a specific room

module.exports = router;
