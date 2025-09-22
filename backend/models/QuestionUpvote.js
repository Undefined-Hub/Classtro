const mongoose = require('mongoose');

const QuestionUpvoteSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

QuestionUpvoteSchema.index({ questionId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('QuestionUpvote', QuestionUpvoteSchema);
