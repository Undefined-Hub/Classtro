// models/Participant.js
const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = guest
  name: { type: String, required: true },

  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },

  kicked: { type: Boolean, default: false },


  ip: String,
  deviceInfo: String,
});

ParticipantSchema.index({ sessionId: 1, userId: 1 });

module.exports = mongoose.model("Participant", ParticipantSchema);
