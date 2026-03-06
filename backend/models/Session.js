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

    participantCount: { type: Number, default: 0 }, // live concurrent count
    totalParticipants: { type: Number, default: 0 }, // unique participants joined

    metadata: { type: mongoose.Schema.Types.Mixed }, // poll configs, Q&A, etc.

    // Session broadcasts/announcements
    broadcasts: [
      {
        message: { type: String, required: true },
        urls: [{ type: String }], // Extracted URLs from message
        urlMetadata: { type: mongoose.Schema.Types.Mixed }, // Map of URL -> metadata object
        files: [
          {
            filename: { type: String, required: true }, // Stored filename
            originalName: { type: String, required: true }, // Original filename
            type: { type: String, enum: ["pdf", "ppt", "pptx", "image"], required: true },
            mimeType: { type: String, required: true },
            size: { type: Number, required: true }, // Size in bytes
            url: { type: String, required: true }, // Access URL
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
        reactions: [
          {
            emoji: { type: String, required: true }, // 👍, ❤️, 🎉, ✅
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            userName: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
          },
        ],
        views: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: { type: String },
            viewedAt: { type: Date, default: Date.now },
          },
        ],
        timestamp: { type: Date, default: Date.now },
      },
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

SessionSchema.index({ roomId: 1, isActive: 1 });
SessionSchema.index({ code: 1 });

module.exports = mongoose.model("Session", SessionSchema);
