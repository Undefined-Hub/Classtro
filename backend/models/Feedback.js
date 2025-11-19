const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["bug", "feedback"],
      index: true,
    },

    title: {
      type: String,
      required: function () {
        return this.type === "bug"; // Required only for bugs
      },
      maxlength: 200,
      trim: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: function () {
        return this.type === "feedback"; // Required only for feedback
      },
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 1 && value <= 5;
        },
        message: "Rating must be an integer between 1 and 5",
      },
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    stepsToReproduce: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: function () {
        return this.type === "bug" ? "medium" : null;
      },
    },

    userEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          if (!email) return true; // Allow null for feedback
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },

    screenshot: {
      type: String,
      default: null,
      trim: true,
    },

    metadata: {
      userAgent: { type: String, default: "" },
      appVersion: { type: String, default: "1.0.0" },
      viewport: { type: String, default: "" },
      url: { type: String, default: "" },
      timestamp: { type: String, default: "" },
      console: [{ type: String }],
    },

    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed"],
      default: "new",
      index: true,
    },

    // Technical tracking fields
    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    // Admin fields (for future use)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Resolution fields
    resolution: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Comments/Notes (for internal use)
    internalNotes: [
      {
        note: { type: String, maxlength: 500 },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },

    lastViewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

module.exports = mongoose.model("Feedback", FeedbackSchema, "systemFeedback");
