const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null if anonymous
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date }
});

module.exports = mongoose.model("Participant", ParticipantSchema);
