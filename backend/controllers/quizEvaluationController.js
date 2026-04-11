const LiveQuiz = require("../models/LiveQuiz");
const QuizSubmission = require("../models/QuizSubmission");

// Evaluate a quiz submission and calculate score
const evaluateQuizSubmission = async (submission) => {
  try {
    const quiz = await LiveQuiz.findById(submission.liveQuizId);

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    let score = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.points || 1;

      const userAnswer = submission.answers.find(
        (a) => a.questionId.toString() === question._id.toString(),
      );

      if (!userAnswer || !userAnswer.selectedOptions) {
        // No answer provided - apply negative marking if applicable
        if (question.negativePoints) {
          score -= question.negativePoints;
        }
        continue;
      }

      // Sort and compare arrays
      const correctAnswers = (question.correctAnswers || []).map(String).sort();
      const selectedOptions = userAnswer.selectedOptions.map(String).sort();

      if (JSON.stringify(correctAnswers) === JSON.stringify(selectedOptions)) {
        // Correct answer
        score += question.points || 1;
      } else if (question.negativePoints) {
        // Wrong answer with negative marking
        score -= question.negativePoints;
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    submission.score = score;
    submission.maxScore = maxScore;
    submission.percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    submission.evaluated = true;

    await submission.save();

    return submission;
  } catch (err) {
    console.error("Error evaluating quiz submission:", err);
    throw err;
  }
};

// Get participant's submission for a quiz
const getParticipantSubmission = async (req, res) => {
  try {
    const { quizId } = req.params;
    const participantId = req.user.id;

    const submission = await QuizSubmission.findOne({
      liveQuizId: quizId,
      participantId,
    }).populate("liveQuizId", "title status");

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  evaluateQuizSubmission,
  getParticipantSubmission,
};
