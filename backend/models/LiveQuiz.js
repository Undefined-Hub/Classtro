const mongoose = require("mongoose");

const LiveOptionSchema = new mongoose.Schema(
  {
    text: String,
  },
  { _id: true }  // This allows _id to be set explicitly or auto-generated
);

const LiveQuestionSchema = new mongoose.Schema(
  {
    type: String,
    questionText: String,
    options: { type: [LiveOptionSchema], default: [] },
    correctAnswers: [mongoose.Schema.Types.ObjectId],
    points: Number,
    negativePoints: Number,
  },
  { _id: true }
);

const LiveQuizSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    launchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizTemplate",
      default: null,
    },
    title: { type: String, required: true },
    questions: { type: [LiveQuestionSchema], required: true },
    status: {
      type: String,
      enum: ["DRAFT", "LIVE", "CLOSED"],
      default: "DRAFT",
    },
    durationSeconds: Number,
    startedAt: Date,
    closedAt: Date,
    allowLateSubmission: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveQuiz", LiveQuizSchema);
