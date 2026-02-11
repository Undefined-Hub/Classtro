const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedOptions: [mongoose.Schema.Types.ObjectId],
    answeredAt: Date,
  },
  { _id: false }
);

const QuizSubmissionSchema = new mongoose.Schema(
  {
    liveQuizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveQuiz",
      required: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    answers: { type: [AnswerSchema], required: true },
    score: Number,
    maxScore: Number,
    percentage: Number,
    evaluated: { type: Boolean, default: false },
    submittedAt: Date,
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuizSubmissionSchema.index(
  { liveQuizId: 1, participantId: 1 },
  { unique: true }
);

module.exports = mongoose.model("QuizSubmission", QuizSubmissionSchema);
