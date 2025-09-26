const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    upvotes: { type: Number, default: 0 },
    isAnswered: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// composite index to support typical queries: unanswered + sort by upvotes/createdAt
QuestionSchema.index({
  sessionId: 1,
  isDeleted: 1,
  isAnswered: 1,
  upvotes: -1,
  createdAt: -1,
});

module.exports = mongoose.model("Question", QuestionSchema);
