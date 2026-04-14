const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { _id: true },
);

const QuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["MCQ", "MULTI_SELECT", "TRUE_FALSE", "SHORT"],
      required: true,
    },
    questionText: { type: String, required: true },
    options: { type: [OptionSchema], default: [] },
    correctAnswers: [{ type: mongoose.Schema.Types.ObjectId }],
    points: { type: Number, default: 1 },
    negativePoints: { type: Number, default: 0 },
  },
  { _id: true },
);

const QuizTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    questions: { type: [QuestionSchema], required: true },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("QuizTemplate", QuizTemplateSchema);
