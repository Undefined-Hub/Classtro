// models/SessionActivity.js
const mongoose = require("mongoose");

const SessionActivitySchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
    index: true,
  },
  
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant", 
    required: true,
    index: true,
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // null for guests
    index: true,
  },
  
  activityType: {
    type: String,
    enum: ["join", "leave", "kicked", "reconnect"],
    required: true,
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  
  metadata: {
    ip: String,
    deviceInfo: String,
    disconnectReason: String, // network, manual, kicked, etc.
  },
});

// Compound indexes for efficient queries
SessionActivitySchema.index({ sessionId: 1, timestamp: 1 });
SessionActivitySchema.index({ participantId: 1, timestamp: 1 });
SessionActivitySchema.index({ sessionId: 1, userId: 1, timestamp: 1 });

module.exports = mongoose.model("SessionActivity", SessionActivitySchema);