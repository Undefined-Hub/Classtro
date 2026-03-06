const LiveQuiz = require("../models/LiveQuiz");
const QuizTemplate = require("../models/QuizTemplate");
const QuizSubmission = require("../models/QuizSubmission");
const Session = require("../models/Session");

const getFriendlyModeLabel = (mode) =>
  mode === "HOST_CONTROLLED" ? "Live Guided" : "Self-Paced";

const buildModeCompatibility = (template, mode) => {
  const invalidQuestions = [];

  template.questions.forEach((question, index) => {
    if (mode === "HOST_CONTROLLED" && question.type === "MULTI_SELECT") {
      invalidQuestions.push({
        index,
        reason: "Multi-select question",
      });
    }
  });

  if (invalidQuestions.length === 0) {
    return { compatible: true, reason: "", invalidQuestions: [] };
  }

  if (mode === "HOST_CONTROLLED") {
    return {
      compatible: false,
      reason:
        "This template includes multi-select questions. Live Guided supports only single-correct MCQ questions.",
      invalidQuestions,
    };
  }

  return {
    compatible: false,
    reason: `This template is not compatible with ${getFriendlyModeLabel(mode)} mode.`,
    invalidQuestions,
  };
};

// Create a live quiz (draft state)
const createLiveQuiz = async (req, res) => {
  try {
    const { 
      sessionId, 
      templateId, 
      title, 
      questions, 
      durationSeconds,
      mode = "ONE_SHOT",
      questionDurationSeconds = 30,
    } = req.body;

    let quizQuestions = questions;
    let quizTitle = title;

    // If templateId is provided, load questions from template
    if (templateId) {
      const template = await QuizTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Quiz template not found" });
      }
      
      // Validate for HOST_CONTROLLED mode - no MULTI_SELECT allowed
      if (mode === "HOST_CONTROLLED") {
        const hasMultiSelect = template.questions.some(q => q.type === "MULTI_SELECT");
        if (hasMultiSelect) {
          return res.status(400).json({ 
            error: "Live Guided mode does not support MULTI_SELECT questions. Please use a template with only MCQ questions." 
          });
        }
      }
      
      // Map template questions to preserve option IDs properly
      quizQuestions = template.questions.map(q => ({
        type: q.type,
        questionText: q.questionText,
        options: q.options.map(opt => ({
          _id: opt._id,
          text: opt.text,
        })),
        correctAnswers: q.correctAnswers,
        points: q.points,
        negativePoints: q.negativePoints,
      }));
      quizTitle = quizTitle || template.title;
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      return res.status(400).json({ error: "Quiz must have at least one question" });
    }
    
    // Validate mode-specific requirements for provided questions
    if (mode === "HOST_CONTROLLED" && !templateId) {
      const hasMultiSelect = quizQuestions.some(q => q.type === "MULTI_SELECT");
      if (hasMultiSelect) {
        return res.status(400).json({ 
          error: "Live Guided mode does not support MULTI_SELECT questions." 
        });
      }
    }

    const quiz = await LiveQuiz.create({
      sessionId,
      launchedBy: req.user.id,
      sourceTemplateId: templateId || null,
      title: quizTitle,
      questions: quizQuestions,
      durationSeconds,
      status: "DRAFT",
      mode,
      questionDurationSeconds: mode === "HOST_CONTROLLED" ? questionDurationSeconds : undefined,
      currentQuestionIndex: mode === "HOST_CONTROLLED" ? -1 : undefined,
      leaderboard: mode === "HOST_CONTROLLED" ? [] : undefined,
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Launch a quiz (change status to LIVE)
const launchQuiz = async (req, res) => {
  try {
    const quiz = await LiveQuiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.launchedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (quiz.status === "LIVE") {
      return res.status(400).json({ error: "Quiz is already live" });
    }

    // Get session to find the join code for socket room
    const session = await Session.findById(quiz.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    quiz.status = "LIVE";
    quiz.startedAt = new Date();
    await quiz.save();

    // Emit real-time event to all session participants using session code
    if (req.io) {
      if (quiz.mode === "HOST_CONTROLLED") {
        // For HOST_CONTROLLED: notify quiz started but don't send questions
        // Teacher will publish questions one by one via socket
        req.io.to(`session:${session.code}`).emit("quiz:launched", {
          quizId: quiz._id,
          title: quiz.title,
          mode: quiz.mode,
          totalQuestions: quiz.questions.length,
          questionDurationSeconds: quiz.questionDurationSeconds,
          startedAt: quiz.startedAt,
        });
      } else {
        // For ONE_SHOT: send all questions at once (existing behavior)
        req.io.to(`session:${session.code}`).emit("quiz:launched", {
          quizId: quiz._id,
          title: quiz.title,
          mode: quiz.mode || "ONE_SHOT",
          questions: quiz.questions.map(q => ({
            _id: q._id,
            type: q.type,
            questionText: q.questionText,
            options: q.options.map(opt => ({
              _id: opt._id,
              text: opt.text,
            })),
            points: q.points,
          })), // Don't send correct answers to clients
          durationSeconds: quiz.durationSeconds,
          startedAt: quiz.startedAt,
        });
      }
    }

    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Close a quiz (change status to CLOSED)
const closeQuiz = async (req, res) => {
  try {
    const quiz = await LiveQuiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.launchedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (quiz.status === "CLOSED") {
      return res.status(400).json({ error: "Quiz is already closed" });
    }

    // Get session to find the join code for socket room
    const session = await Session.findById(quiz.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    quiz.status = "CLOSED";
    quiz.closedAt = new Date();
    await quiz.save();

    // Emit real-time event using session code
    if (req.io) {
      req.io.to(`session:${session.code}`).emit("quiz:closed", {
        quizId: quiz._id,
        closedAt: quiz.closedAt,
      });
    }

    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all quizzes for a session
const getSessionQuizzes = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const quizzes = await LiveQuiz.find({ sessionId })
      .populate("launchedBy", "name email")
      .populate("sourceTemplateId", "title")
      .sort({ createdAt: -1 });
    
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single live quiz by ID
const getLiveQuizById = async (req, res) => {
  try {
    const quiz = await LiveQuiz.findById(req.params.id)
      .populate("launchedBy", "name email")
      .populate("sourceTemplateId", "title");
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get quiz results (submissions)
const getQuizResults = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    
    const quiz = await LiveQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const submissions = await QuizSubmission.find({ liveQuizId: quizId })
      .populate("participantId", "name email")
      .sort({ score: -1 });
    
    res.json({
      quiz: {
        title: quiz.title,
        status: quiz.status,
        totalQuestions: quiz.questions.length,
      },
      submissions,
      stats: {
        totalSubmissions: submissions.length,
        averageScore: submissions.length > 0
          ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
          : 0,
        highestScore: submissions.length > 0 ? submissions[0].score : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Validate if a template is compatible with HOST_CONTROLLED mode
const validateTemplateForMode = async (req, res) => {
  try {
    const { templateId, mode } = req.query;
    
    if (!templateId) {
      return res.status(400).json({ error: "templateId is required" });
    }
    
    const template = await QuizTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: "Quiz template not found" });
    }
    
    // Check ownership
    if (template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const result = {
      templateId,
      title: template.title,
      totalQuestions: template.questions.length,
      questionTypes: {},
      compatible: {
        ONE_SHOT: true,
        HOST_CONTROLLED: true,
      },
      issues: [],
    };
    
    // Analyze question types
    template.questions.forEach(q => {
      result.questionTypes[q.type] = (result.questionTypes[q.type] || 0) + 1;
    });
    
    // Check HOST_CONTROLLED compatibility
    const hostControlledCheck = buildModeCompatibility(template, "HOST_CONTROLLED");
    if (!hostControlledCheck.compatible) {
      result.compatible.HOST_CONTROLLED = false;
      result.issues.push(hostControlledCheck.reason);
    }
    
    // If specific mode requested, return simple boolean
    if (mode) {
      const modeCheck = buildModeCompatibility(template, mode);
      return res.json({
        compatible: modeCheck.compatible,
        reason: modeCheck.reason,
        issues: modeCheck.compatible ? [] : [modeCheck.reason],
        invalidQuestions: modeCheck.invalidQuestions,
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createLiveQuiz,
  launchQuiz,
  closeQuiz,
  getSessionQuizzes,
  getLiveQuizById,
  getQuizResults,
  validateTemplateForMode,
};
