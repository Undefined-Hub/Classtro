const { Router } = require("express");
const {
  createLiveQuiz,
  launchQuiz,
  closeQuiz,
  getSessionQuizzes,
  getLiveQuizById,
  getQuizResults,
} = require("../controllers/liveQuizController");
const { getParticipantSubmission } = require("../controllers/quizEvaluationController");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// POST /api/live-quizzes - Create a new live quiz (draft)
router.post("/", createLiveQuiz);

// POST /api/live-quizzes/:id/launch - Launch a quiz (make it live)
router.post("/:id/launch", launchQuiz);

// POST /api/live-quizzes/:id/close - Close a quiz
router.post("/:id/close", closeQuiz);

// GET /api/live-quizzes/session/:sessionId - Get all quizzes for a session
router.get("/session/:sessionId", getSessionQuizzes);

// GET /api/live-quizzes/:id - Get a single live quiz
router.get("/:id", getLiveQuizById);

// GET /api/live-quizzes/:id/results - Get quiz results (submissions)
router.get("/:id/results", getQuizResults);

// GET /api/live-quizzes/:quizId/my-submission - Get participant's own submission
router.get("/:quizId/my-submission", getParticipantSubmission);

module.exports = router;
