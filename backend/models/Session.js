// models/Session.js
const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: false,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String }, // e.g., "Lecture 7 - Joins in DBMS"
    code: { type: String, required: true, unique: true }, // join code
    isActive: { type: Boolean, default: true },

    startAt: { type: Date, default: Date.now },
    endAt: { type: Date },

    maxStudents: { type: Number, default: 200 },
    participantCount: { type: Number, default: 0 }, // snapshot, updated periodically

    metadata: { type: mongoose.Schema.Types.Mixed }, // poll configs, Q&A, etc.

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

SessionSchema.index({ roomId: 1, isActive: 1 });
SessionSchema.index({ code: 1 });

module.exports = mongoose.model("Session", SessionSchema);
