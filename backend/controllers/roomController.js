const Room = require("../models/Room");
const Participant = require("../models/Participant");
const crypto = require("crypto");

// helper for code
function generateCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char
}

const createRoom = async (req, res) => {
  try {
    const code = generateCode();
    console.log(req.body.user);
    const room = await Room.create({
      name: req.body.name,
      teacherId: req.user.id || null, // in future, get from auth
      code
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code, isActive: true })
      .select("name code isActive createdAt");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code, isActive: true });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const participant = await Participant.create({
      roomId: room._id,
      name: req.body.name,
      userId: req.user ? req.user.id : null
    });

    // In future: return a socket token
    res.json({ message: "Joined successfully", participantId: participant._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const leaveRoom = async (req, res) => {
  try {
    await Participant.findByIdAndUpdate(req.body.participantId, { leftAt: new Date() });
    res.json({ message: "Left room" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const closeRoom = async (req, res) => {
  try {
    await Room.findOneAndUpdate({ code: req.params.code, teacherId: req.user.id }, { isActive: false });
    res.json({ message: "Room closed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getParticipants = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code, teacherId: req.user.id });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const participants = await Participant.find({ roomId: room._id });
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const kickParticipant = async (req, res) => {
  try {
    // just mark them as left
    await Participant.findByIdAndUpdate(req.body.participantId, { leftAt: new Date() });
    res.json({ message: "Participant kicked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRoom,
  closeRoom,
  getParticipants,
  kickParticipant,
  getRoom,
  joinRoom,
  leaveRoom
};