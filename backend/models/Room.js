// models/Room.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "DBMS" or "AI Workshop"
  description: { type: String },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  slug: { type: String, unique: true, sparse: true }, // optional nice URL
  defaultMaxStudents: { type: Number, default: 200 },
  settings: { type: mongoose.Schema.Types.Mixed }, // future configs
  archivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", RoomSchema);
