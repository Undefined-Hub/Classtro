const { Router } = require("express");
const {
  createQuizTemplate,
  getQuizTemplates,
  getQuizTemplateById,
  updateQuizTemplate,
  deleteQuizTemplate,
} = require("../controllers/quizTemplateController");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// * POST /api/quiz-templates - Create a new quiz template
router.post("/", createQuizTemplate);

// * GET /api/quiz-templates - Get all templates for logged-in user
router.get("/", getQuizTemplates);

// * GET /api/quiz-templates/:id - Get a single template by ID
router.get("/:id", getQuizTemplateById);

// * PUT /api/quiz-templates/:id - Update a template
router.put("/:id", updateQuizTemplate);

// * DELETE /api/quiz-templates/:id - Delete a template
router.delete("/:id", deleteQuizTemplate);

module.exports = router;
