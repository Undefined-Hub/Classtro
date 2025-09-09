const express = require("express");
const router = express.Router();
// const { authTeacher } = require("../middleware/authMiddleware");
const {createRoom, closeRoom, getParticipants, kickParticipant, getRoom, joinRoom, leaveRoom} = require("../controllers/roomController");

// Teacher routes
router.post("/", createRoom);
router.post("/:code/close", closeRoom);
router.get("/:code/participants", getParticipants);
router.post("/:code/kick", kickParticipant);

// Student routes
router.get("/:code", getRoom);
router.post("/:code/join", joinRoom);
router.post("/:code/leave", leaveRoom);

module.exports = router;
