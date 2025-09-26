const { Router } = require("express");
const {
  createQuestion,
  editQuestion,
  deleteQuestion,
  upvoteQuestion,
  markAnswered,
  getQuestionsBySession,
} = require("../controllers/qnaController");

const router = Router();

// Public: fetch questions for a session
router.get("/session/:sessionId", getQuestionsBySession);

// Protected endpoints
router.post("/", createQuestion); // body: { sessionId, text }
router.put("/:id", editQuestion);
router.delete("/:id", deleteQuestion);
router.post("/:id/upvote", upvoteQuestion);
router.patch("/:id/answer", markAnswered); // teacher only

module.exports = router;
