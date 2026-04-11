// models/SessionAnalytics.js
const mongoose = require("mongoose");

const SessionAnalyticsSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
      unique: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null, // Optional TTL for auto-cleanup
    },

    sections: {
      participants: { type: mongoose.Schema.Types.Mixed, default: null },
      timeline: { type: Array, default: null },
      polls: { type: Array, default: null },
      qna: { type: mongoose.Schema.Types.Mixed, default: null },
      attendance: { type: Array, default: null },
      feedback: { type: mongoose.Schema.Types.Mixed, default: null },
      ai: { type: mongoose.Schema.Types.Mixed, default: null }, // Optional AI insights
    },

    includedSections: {
      participants: { type: Boolean, default: null },
      timeline: { type: Boolean, default: null },
      polls: { type: Boolean, default: null },
      qna: { type: Boolean, default: null },
      attendance: { type: Boolean, default: null },
      feedback: { type: Boolean, default: null },
      ai: { type: Boolean, default: null },
    },
  },
  {
    timestamps: true,
  },
);

// Optional TTL index for auto-cleanup (uncomment if needed)
// SessionAnalyticsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("SessionAnalytics", SessionAnalyticsSchema);
