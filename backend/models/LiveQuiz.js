const mongoose = require("mongoose");

const LiveOptionSchema = new mongoose.Schema(
  {
    text: String,
  },
  { _id: true }, // This allows _id to be set explicitly or auto-generated
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
  { _id: true },
);

// Leaderboard entry schema for HOST_CONTROLLED mode
const LeaderboardEntrySchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participantName: { type: String, required: true },
    totalScore: { type: Number, default: 0 },
  },
  { _id: false },
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
    // Quiz mode: ONE_SHOT (submit all at once) or HOST_CONTROLLED (Kahoot-style)
    mode: {
      type: String,
      enum: ["ONE_SHOT", "HOST_CONTROLLED"],
      default: "ONE_SHOT",
    },
    // For HOST_CONTROLLED: current question index (-1 = not started)
    currentQuestionIndex: {
      type: Number,
      default: -1,
    },
    // Time limit per question in HOST_CONTROLLED mode (seconds)
    questionDurationSeconds: {
      type: Number,
      default: 30,
    },
    // When current question was published (for calculating response time)
    currentQuestionStartedAt: {
      type: Date,
      default: null,
    },
    // Running leaderboard for HOST_CONTROLLED mode
    leaderboard: {
      type: [LeaderboardEntrySchema],
      default: [],
    },
    durationSeconds: Number,
    startedAt: Date,
    closedAt: Date,
    allowLateSubmission: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LiveQuiz", LiveQuizSchema);
