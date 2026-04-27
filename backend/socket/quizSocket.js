const LiveQuiz = require("../models/LiveQuiz");
const QuizSubmission = require("../models/QuizSubmission");
const Session = require("../models/Session");
const User = require("../models/User");
const Participant = require("../models/Participant");
const {
  evaluateQuizSubmission,
} = require("../controllers/quizEvaluationController");

// Helper function to get user's display name
const getUserDisplayName = async (userId, sessionId) => {
  try {
    // First try to get name from Participant (works for both guests and logged-in users)
    if (sessionId) {
      const participant = await Participant.findOne({
        sessionId,
        userId,
      }).select("name");
      if (participant?.name) return participant.name;
    }
    // Fallback to User model
    const user = await User.findById(userId).select("name");
    if (user?.name) return user.name;
    return "Unknown";
  } catch (err) {
    console.error("Error fetching user name:", err);
    return "Unknown";
  }
};

const registerQuizSocket = (io, socket) => {
  console.log("🎯 Quiz socket handlers registered for:", socket.id);

  // Handle quiz submission from participants
  socket.on("quiz:submit", async ({ quizId, answers }) => {
    try {
      const userId = socket.user?.id;

      if (!userId) {
        socket.emit("quiz:submission:error", {
          error: "User not authenticated",
        });
        return;
      }

      console.log(
        `📝 Quiz submission received from user ${userId} for quiz ${quizId}`,
      );

      // Fetch the quiz
      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:submission:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.status !== "LIVE") {
        socket.emit("quiz:submission:error", {
          error: "Quiz is not accepting submissions",
        });
        return;
      }

      // Check if user already submitted
      const existingSubmission = await QuizSubmission.findOne({
        liveQuizId: quizId,
        participantId: userId,
      });

      if (existingSubmission) {
        socket.emit("quiz:submission:error", {
          error: "You have already submitted this quiz",
        });
        return;
      }

      // Check if submission is late
      const isLate =
        quiz.durationSeconds && quiz.startedAt
          ? (Date.now() - new Date(quiz.startedAt).getTime()) / 1000 >
            quiz.durationSeconds
          : false;

      if (isLate && !quiz.allowLateSubmission) {
        socket.emit("quiz:submission:error", {
          error: "Quiz time has expired",
        });
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
        const participantName = await getUserDisplayName(
          userId,
          quiz.sessionId,
        );
        io.to(`session:${session.code}`).emit("quiz:new:submission", {
          quizId,
          participantId: userId,
          participantName,
          submissionId: submission._id,
          score: evaluatedSubmission.score,
          total: evaluatedSubmission.maxScore,
          percentage: evaluatedSubmission.percentage,
          submittedAt: submission.submittedAt,
        });
      }

      console.log(
        `📊 Quiz submission evaluated - Score: ${evaluatedSubmission.score}/${evaluatedSubmission.maxScore}`,
      );
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
          questions: quiz.questions.map((q) => ({
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HOST_CONTROLLED MODE HANDLERS (Kahoot-style)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Teacher publishes the next question to all students
   * Event: quiz:hc:publish
   * Payload: { quizId }
   */
  socket.on("quiz:hc:publish", async ({ quizId }) => {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("quiz:hc:error", { error: "Not authenticated" });
        return;
      }

      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:hc:error", { error: "Quiz not found" });
        return;
      }

      // Verify teacher owns the quiz
      if (quiz.launchedBy.toString() !== userId) {
        socket.emit("quiz:hc:error", {
          error: "Only the quiz host can publish questions",
        });
        return;
      }

      if (quiz.mode !== "HOST_CONTROLLED") {
        socket.emit("quiz:hc:error", {
          error: "Quiz is not in Live Guided mode",
        });
        return;
      }

      if (quiz.status !== "LIVE") {
        socket.emit("quiz:hc:error", { error: "Quiz is not live" });
        return;
      }

      // Check if there are more questions
      const nextIndex = quiz.currentQuestionIndex + 1;
      if (nextIndex >= quiz.questions.length) {
        socket.emit("quiz:hc:error", { error: "No more questions to publish" });
        return;
      }

      // Update quiz with new question index and start time
      quiz.currentQuestionIndex = nextIndex;
      quiz.currentQuestionStartedAt = new Date();
      await quiz.save();

      const currentQuestion = quiz.questions[nextIndex];

      // Prepare question data (without correct answers)
      const questionData = {
        quizId: quiz._id,
        questionIndex: nextIndex,
        totalQuestions: quiz.questions.length,
        question: {
          _id: currentQuestion._id,
          type: currentQuestion.type,
          questionText: currentQuestion.questionText,
          options: currentQuestion.options.map((opt) => ({
            _id: opt._id,
            text: opt.text,
          })),
          points: currentQuestion.points,
        },
        durationSeconds: quiz.questionDurationSeconds,
        startedAt: quiz.currentQuestionStartedAt,
      };

      // Get session for room broadcasting
      const session = await Session.findById(quiz.sessionId);
      if (!session) {
        socket.emit("quiz:hc:error", { error: "Session not found" });
        return;
      }

      // Broadcast to all participants in the session
      io.to(`session:${session.code}`).emit("quiz:hc:question", questionData);

      console.log(
        `📢 Question ${nextIndex + 1}/${quiz.questions.length} published for quiz ${quizId}`,
      );
    } catch (err) {
      console.error("❌ Error in quiz:hc:publish:", err);
      socket.emit("quiz:hc:error", { error: err.message });
    }
  });

  /**
   * Student submits answer for the current question
   * Event: quiz:hc:answer
   * Payload: { quizId, questionId, selectedOptions }
   */
  socket.on(
    "quiz:hc:answer",
    async ({ quizId, questionId, selectedOptions }) => {
      try {
        const userId = socket.user?.id;

        if (!userId) {
          socket.emit("quiz:hc:error", { error: "Not authenticated" });
          return;
        }

        const quiz = await LiveQuiz.findById(quizId);

        // Get user's display name from database
        const userName = await getUserDisplayName(userId, quiz?.sessionId);
        if (!quiz) {
          socket.emit("quiz:hc:error", { error: "Quiz not found" });
          return;
        }

        if (quiz.mode !== "HOST_CONTROLLED" || quiz.status !== "LIVE") {
          socket.emit("quiz:hc:error", {
            error: "Quiz is not accepting answers",
          });
          return;
        }

        // Validate question is the current one
        const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
        if (!currentQuestion || currentQuestion._id.toString() !== questionId) {
          socket.emit("quiz:hc:error", {
            error: "This question is no longer accepting answers",
          });
          return;
        }

        // Calculate response time
        const now = new Date();
        const responseTimeMs =
          now.getTime() - new Date(quiz.currentQuestionStartedAt).getTime();
        const timeoutMs = quiz.questionDurationSeconds * 1000;
        
        // Allow a 5-second grace period for network latency and auto-submits
        const GRACE_PERIOD_MS = 5000; 

        // Check if answer is within time limit
        if (responseTimeMs > timeoutMs + GRACE_PERIOD_MS) {
          socket.emit("quiz:hc:error", {
            error: "Time expired for this question",
          });
          return;
        }

        // Find or create submission record
        let submission = await QuizSubmission.findOne({
          liveQuizId: quizId,
          participantId: userId,
        });

        if (!submission) {
          submission = new QuizSubmission({
            liveQuizId: quizId,
            participantId: userId,
            sessionId: quiz.sessionId,
            answers: [],
            score: 0,
            maxScore: 0,
          });
        }

        // Check if already answered this question
        const existingAnswer = submission.answers.find(
          (a) => a.questionId.toString() === questionId,
        );
        if (existingAnswer) {
          socket.emit("quiz:hc:error", {
            error: "You have already answered this question",
          });
          return;
        }

        // Evaluate the answer
        const correctAnswers = currentQuestion.correctAnswers.map((id) =>
          id.toString(),
        );
        const selectedStrings = selectedOptions.map((id) => id.toString());

        // For MCQ: exact match (single option must be correct)
        const isCorrect =
          correctAnswers.length === selectedStrings.length &&
          correctAnswers.every((id) => selectedStrings.includes(id));

        // Calculate score with speed bonus
        // Base score if correct, speed bonus up to 50% extra for fastest answers
        let scoreAwarded = 0;
        if (isCorrect) {
          const basePoints = (currentQuestion.points || 1) * 100;
          const speedFactor = Math.max(0, 1 - responseTimeMs / timeoutMs); // 1.0 at instant, 0 at timeout
          const speedBonus = basePoints * 0.5 * speedFactor; // Up to 50% bonus
          scoreAwarded = Math.round(basePoints + speedBonus);
        }

        // Add answer to submission
        submission.answers.push({
          questionId: currentQuestion._id,
          selectedOptions,
          answeredAt: now,
          isCorrect,
          scoreAwarded,
          responseTimeMs,
        });

        // Update total score
        submission.score = submission.answers.reduce(
          (sum, a) => sum + (a.scoreAwarded || 0),
          0,
        );
        submission.maxScore = quiz.questions
          .slice(0, quiz.currentQuestionIndex + 1)
          .reduce((sum, q) => sum + ((q.points || 1) * 100), 0);
        submission.percentage =
          submission.maxScore > 0
            ? Math.min(100, Math.round((submission.score / submission.maxScore) * 100))
            : 0;

        await submission.save();

        // Update leaderboard in quiz
        const leaderboardEntry = quiz.leaderboard.find(
          (e) => e.participantId.toString() === userId,
        );
        if (leaderboardEntry) {
          leaderboardEntry.totalScore = submission.score;
        } else {
          quiz.leaderboard.push({
            participantId: userId,
            participantName: userName,
            totalScore: submission.score,
          });
        }
        await quiz.save();

        // Acknowledge to student
        socket.emit("quiz:hc:answer:ack", {
          quizId,
          questionId,
          isCorrect,
          scoreAwarded,
          totalScore: submission.score,
          responseTimeMs,
        });

        // Notify teacher
        const session = await Session.findById(quiz.sessionId);
        if (session) {
          io.to(`session:${session.code}`).emit("quiz:hc:answer:received", {
            quizId,
            questionId,
            participantId: userId,
            participantName: userName,
          });
        }

        console.log(
          `✅ Answer received from ${userName} - Correct: ${isCorrect}, Score: ${scoreAwarded}`,
        );
      } catch (err) {
        console.error("❌ Error in quiz:hc:answer:", err);
        socket.emit("quiz:hc:error", { error: err.message });
      }
    },
  );

  /**
   * Teacher closes current question and reveals leaderboard
   * Event: quiz:hc:close
   * Payload: { quizId }
   */
  socket.on("quiz:hc:close", async ({ quizId }) => {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("quiz:hc:error", { error: "Not authenticated" });
        return;
      }

      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:hc:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.launchedBy.toString() !== userId) {
        socket.emit("quiz:hc:error", {
          error: "Only the quiz host can close questions",
        });
        return;
      }

      if (quiz.mode !== "HOST_CONTROLLED" || quiz.status !== "LIVE") {
        socket.emit("quiz:hc:error", { error: "Quiz is not in proper state" });
        return;
      }

      const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
      if (!currentQuestion) {
        socket.emit("quiz:hc:error", { error: "No active question to close" });
        return;
      }

      // Sort leaderboard by score descending
      const sortedLeaderboard = [...quiz.leaderboard].sort(
        (a, b) => b.totalScore - a.totalScore,
      );

      // Get answer statistics for this question
      const submissions = await QuizSubmission.find({ liveQuizId: quizId });
      const questionAnswers = submissions
        .map((s) =>
          s.answers.find(
            (a) => a.questionId.toString() === currentQuestion._id.toString(),
          ),
        )
        .filter(Boolean);

      const correctCount = questionAnswers.filter((a) => a.isCorrect).length;
      const totalAnswered = questionAnswers.length;

      // Build results data
      const resultsData = {
        quizId,
        questionIndex: quiz.currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        question: {
          _id: currentQuestion._id,
          questionText: currentQuestion.questionText,
          options: currentQuestion.options,
          correctAnswers: currentQuestion.correctAnswers,
        },
        stats: {
          totalAnswered,
          correctCount,
          incorrectCount: totalAnswered - correctCount,
        },
        leaderboard: sortedLeaderboard.slice(0, 10), // Top 10
        isLastQuestion: quiz.currentQuestionIndex >= quiz.questions.length - 1,
      };

      // Broadcast results to all participants
      const session = await Session.findById(quiz.sessionId);
      if (session) {
        io.to(`session:${session.code}`).emit("quiz:hc:results", resultsData);
      }

      console.log(
        `📊 Question ${quiz.currentQuestionIndex + 1} closed - ${correctCount}/${totalAnswered} correct`,
      );
    } catch (err) {
      console.error("❌ Error in quiz:hc:close:", err);
      socket.emit("quiz:hc:error", { error: err.message });
    }
  });

  /**
   * Teacher ends the quiz entirely
   * Event: quiz:hc:end
   * Payload: { quizId }
   */
  socket.on("quiz:hc:end", async ({ quizId }) => {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("quiz:hc:error", { error: "Not authenticated" });
        return;
      }

      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:hc:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.launchedBy.toString() !== userId) {
        socket.emit("quiz:hc:error", {
          error: "Only the quiz host can end the quiz",
        });
        return;
      }

      // Update quiz status
      quiz.status = "CLOSED";
      quiz.closedAt = new Date();
      await quiz.save();

      // Calculate final scores for all submissions
      const submissions = await QuizSubmission.find({
        liveQuizId: quizId,
      }).populate("participantId", "name");

      // Mark all submissions as evaluated
      for (const submission of submissions) {
        submission.evaluated = true;
        submission.submittedAt = new Date();
        await submission.save();
      }

      // Sort leaderboard by score descending
      const sortedLeaderboard = [...quiz.leaderboard].sort(
        (a, b) => b.totalScore - a.totalScore,
      );

      // Calculate total possible score
      const maxPossibleScore = quiz.questions.reduce(
        (sum, q) => sum + (q.points || 1) * 1.5,
        0,
      ); // Including max speed bonus

      // Build final results
      const finalResults = {
        quizId,
        title: quiz.title,
        totalQuestions: quiz.questions.length,
        leaderboard: sortedLeaderboard,
        maxPossibleScore: Math.round(maxPossibleScore * 100) / 100,
        stats: {
          totalParticipants: submissions.length,
          averageScore:
            submissions.length > 0
              ? Math.round(
                  (submissions.reduce((sum, s) => sum + s.score, 0) /
                    submissions.length) *
                    100,
                ) / 100
              : 0,
        },
      };

      // Broadcast final results to all participants
      const session = await Session.findById(quiz.sessionId);
      if (session) {
        io.to(`session:${session.code}`).emit("quiz:hc:final", finalResults);
      }

      console.log(
        `🏁 Quiz ${quizId} ended - ${submissions.length} participants`,
      );
    } catch (err) {
      console.error("❌ Error in quiz:hc:end:", err);
      socket.emit("quiz:hc:error", { error: err.message });
    }
  });

  /**
   * Handle request for current HOST_CONTROLLED quiz state (for late joiners)
   * Event: quiz:hc:sync
   * Payload: { quizId }
   */
  socket.on("quiz:hc:sync", async ({ quizId }) => {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit("quiz:hc:error", { error: "Not authenticated" });
        return;
      }

      const quiz = await LiveQuiz.findById(quizId);
      if (!quiz) {
        socket.emit("quiz:hc:error", { error: "Quiz not found" });
        return;
      }

      if (quiz.mode !== "HOST_CONTROLLED") {
        socket.emit("quiz:hc:error", { error: "Quiz is not Live Guided" });
        return;
      }

      // If quiz is waiting for first question
      if (quiz.currentQuestionIndex < 0) {
        socket.emit("quiz:hc:state", {
          quizId: quiz._id,
          title: quiz.title,
          status: "WAITING",
          totalQuestions: quiz.questions.length,
        });
        return;
      }

      // Check if student already answered current question
      const submission = await QuizSubmission.findOne({
        liveQuizId: quizId,
        participantId: userId,
      });

      const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
      const hasAnswered = submission?.answers.some(
        (a) => a.questionId.toString() === currentQuestion._id.toString(),
      );

      // Calculate remaining time
      const elapsedMs =
        Date.now() - new Date(quiz.currentQuestionStartedAt).getTime();
      const remainingSeconds = Math.max(
        0,
        quiz.questionDurationSeconds - Math.floor(elapsedMs / 1000),
      );

      socket.emit("quiz:hc:state", {
        quizId: quiz._id,
        title: quiz.title,
        status: quiz.status,
        currentQuestionIndex: quiz.currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        question: hasAnswered
          ? null
          : {
              _id: currentQuestion._id,
              type: currentQuestion.type,
              questionText: currentQuestion.questionText,
              options: currentQuestion.options.map((opt) => ({
                _id: opt._id,
                text: opt.text,
              })),
              points: currentQuestion.points,
            },
        hasAnswered,
        remainingSeconds,
        myScore: submission?.score || 0,
      });
    } catch (err) {
      console.error("❌ Error in quiz:hc:sync:", err);
      socket.emit("quiz:hc:error", { error: err.message });
    }
  });
};

module.exports = { registerQuizSocket };
