const LiveQuiz = require("../models/LiveQuiz");
const QuizSubmission = require("../models/QuizSubmission");
const Session = require("../models/Session");
const { evaluateQuizSubmission } = require("../controllers/quizEvaluationController");

const registerQuizSocket = (io, socket) => {
  console.log("🎯 Quiz socket handlers registered for:", socket.id);

  // Handle quiz submission from participants
  socket.on("quiz:submit", async ({ quizId, answers }) => {
    try {
      const userId = socket.user?.id;
      
      if (!userId) {
        socket.emit("quiz:submission:error", { error: "User not authenticated" });
        return;
      }

      console.log(`📝 Quiz submission received from user ${userId} for quiz ${quizId}`);

      // Fetch the quiz
      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:submission:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.status !== "LIVE") {
        socket.emit("quiz:submission:error", { error: "Quiz is not accepting submissions" });
        return;
      }

      // Check if user already submitted
      const existingSubmission = await QuizSubmission.findOne({
        liveQuizId: quizId,
        participantId: userId,
      });

      if (existingSubmission) {
        socket.emit("quiz:submission:error", { error: "You have already submitted this quiz" });
        return;
      }

      // Check if submission is late
      const isLate = quiz.durationSeconds && quiz.startedAt
        ? (Date.now() - new Date(quiz.startedAt).getTime()) / 1000 > quiz.durationSeconds
        : false;

      if (isLate && !quiz.allowLateSubmission) {
        socket.emit("quiz:submission:error", { error: "Quiz time has expired" });
        return;
      }

      // Create the submission
      const submission = await QuizSubmission.create({
        liveQuizId: quizId,
        participantId: userId,
        sessionId: quiz.sessionId,
        answers,
        submittedAt: new Date(),
        isLate,
      });

      console.log(`✅ Submission created: ${submission._id}`);

      // Evaluate the submission immediately
      const evaluatedSubmission = await evaluateQuizSubmission(submission);

      // Send acknowledgment to the participant
      socket.emit("quiz:submission:ack", {
        quizId,
        submissionId: submission._id,
        score: evaluatedSubmission.score,
        maxScore: evaluatedSubmission.maxScore,
        percentage: evaluatedSubmission.percentage,
      });

      // Notify teacher/session about new submission - use session code for room
      const session = await Session.findById(quiz.sessionId);
      if (session) {
        io.to(`session:${session.code}`).emit("quiz:new:submission", {
          quizId,
          participantId: userId,
          participantName: socket.user?.name || "Unknown",
          submissionId: submission._id,
          score: evaluatedSubmission.score,
          total: evaluatedSubmission.maxScore,
          percentage: evaluatedSubmission.percentage,
          submittedAt: submission.submittedAt,
        });
      }

      console.log(`📊 Quiz submission evaluated - Score: ${evaluatedSubmission.score}/${evaluatedSubmission.maxScore}`);
    } catch (err) {
      console.error("❌ Error in quiz:submit:", err);
      socket.emit("quiz:submission:error", { error: err.message });
    }
  });

  // Handle request for live quiz data (for participants joining late)
  socket.on("quiz:request", async ({ quizId }) => {
    try {
      const quiz = await LiveQuiz.findById(quizId);
      
      if (!quiz) {
        socket.emit("quiz:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.status === "LIVE") {
        // Send quiz data without correct answers
        socket.emit("quiz:data", {
          quizId: quiz._id,
          title: quiz.title,
          questions: quiz.questions.map(q => ({
            _id: q._id,
            type: q.type,
            questionText: q.questionText,
            options: q.options,
            points: q.points,
          })),
          durationSeconds: quiz.durationSeconds,
          startedAt: quiz.startedAt,
        });
      } else {
        socket.emit("quiz:error", { error: "Quiz is not live" });
      }
    } catch (err) {
      console.error("❌ Error in quiz:request:", err);
      socket.emit("quiz:error", { error: err.message });
    }
  });
};

module.exports = { registerQuizSocket };
