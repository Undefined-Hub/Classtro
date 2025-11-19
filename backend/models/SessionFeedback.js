const mongoose = require("mongoose");

const SessionFeedbackSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 1 && value <= 5;
        },
        message: "Rating must be an integer between 1 and 5",
      },
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate feedback from same user for same session
SessionFeedbackSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model(
  "SessionFeedback",
  SessionFeedbackSchema,
  "sessionFeedback"
);
