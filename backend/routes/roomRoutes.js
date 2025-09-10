const express = require("express");
const router = express.Router();
// const { authTeacher } = require("../middleware/authMiddleware");
const { createRoom, listRooms, getRoomById, updateRoom, deleteRoom, unarchiveRoom, hardDeleteRoom, listRoomSessions} = require("../controllers/roomController");

// --- Teacher routes ---
router.post("/", createRoom);                    // Create a new room
router.get("/", listRooms);                      // List teacher's rooms (paginated)
router.get("/:roomId", getRoomById);             // Get single room details
router.patch("/:roomId", updateRoom);            // Update room metadata
router.delete("/:roomId", deleteRoom);           // Archive / soft-delete a room
router.patch("/:roomId/unarchive", unarchiveRoom); // Unarchive a room
router.delete("/:roomId/hard", hardDeleteRoom); // Permanently delete a room
router.get("/:roomId/sessions", listRoomSessions); // List sessions of a room

module.exports = router;
