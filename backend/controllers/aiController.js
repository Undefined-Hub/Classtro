const { generateAIResponse, checkAIHealth } = require("../services/ai/core");
const { buildChatPrompt } = require("../services/ai/prompts/chatPrompt");
const {
  getMemory,
  storeMemory,
  extractSummary,
  getUserIdentifier,
} = require("../services/ai/memoryManager");
const { isFollowUpQuestion } = require("../services/ai/followUpDetector");
const { detectIntent } = require("../services/ai/intentDetector");

/**
 * POST /api/ai/generate-quiz
 * Body: { topic, keywords?, difficulty, count, defaultPoints }
 */
async function generateQuiz(req, res) {
  try {
    const {
      topic,
      keywords = "",
      difficulty = "medium",
      count = 5,
      defaultPoints = 1,
    } = req.body || {};
    const { questionMode = "both" } = req.body || {};

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ message: "Topic is required" });
    }
    const n = Math.min(20, Math.max(1, parseInt(count) || 5));

    // Build a prompt that requests strict JSON output and includes the requested question mode
    const normalizedMode = String(questionMode || "both").toLowerCase();
    let modeInstruction =
      "You may generate a mix of MCQ and MULTI_SELECT questions.";
    if (normalizedMode === "mcq") {
      modeInstruction =
        "Generate ONLY MCQ questions (each with a single correct answer).";
    } else if (normalizedMode === "multi") {
      modeInstruction =
        "Generate ONLY MULTI_SELECT questions (each should have two correct answers).";
    }

    const prompt =
      `You are an assistant that generates multiple-choice quizzes. Output ONLY valid JSON that matches this schema:\n` +
      `{ "questions": [ { "type": "MCQ|MULTI_SELECT", "questionText": string, "options": [{ "optionId": string, "text": string }], "correctAnswers": [optionId|string|index], "points": 1, "negativePoints": 0 } ] }\n` +
      `Generate ${n} questions on the topic: "${topic}". Difficulty: ${difficulty}. Keywords: "${keywords}". ${modeInstruction} ` +
      `Each question should have 3-5 options. For MULTI_SELECT include 2 correct options when requested. Use short, clear questions and options. Use unique optionId for each option. Return exactly the JSON object and nothing else.`;

    const raw = await generateAIResponse(prompt, {
      maxTokens: 800,
      temperature: difficulty === "hard" ? 0.6 : 0.25,
    });

    // Try parse JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // attempt to extract JSON substring
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (err2) {
          return res
            .status(502)
            .json({ message: "AI returned invalid JSON", raw });
        }
      } else {
        return res
          .status(502)
          .json({ message: "AI returned invalid response", raw });
      }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return res
        .status(502)
        .json({ message: "AI returned unexpected schema", raw });
    }

    // Sanitize and normalize questions
    const questions = parsed.questions.slice(0, n).map((q, qi) => {
      const opts = (q.options || []).slice(0, 6).map((o, oi) => ({
        optionId: String(o.optionId || o.id || `ai_${Date.now()}_${qi}_${oi}`),
        text: String(o.text || o),
      }));

      let correctAnswers = q.correctAnswers || [];
      // If correctAnswers are numeric indices, convert to optionId
      correctAnswers = correctAnswers
        .map((c) => {
          if (typeof c === "number") return opts[c]?.optionId;
          // if matches option text, find optionId
          const found = opts.find((o) => o.text.trim() === String(c).trim());
          if (found) return found.optionId;
          return String(c);
        })
        .filter(Boolean);

      if (!correctAnswers.length && opts.length)
        correctAnswers = [opts[0].optionId];

      return {
        type: q.type === "MULTI_SELECT" ? "MULTI_SELECT" : "MCQ",
        questionText: String(q.questionText || q.question || "").trim(),
        options: opts,
        correctAnswers,
        points: typeof q.points === "number" ? q.points : defaultPoints,
        negativePoints:
          typeof q.negativePoints === "number" ? q.negativePoints : 0,
      };
    });

    // Coerce/filter results to requested questionMode (coercion strategy)
    const mode = String(questionMode || "both").toLowerCase();
    questions.forEach((q) => {
      if (mode === "mcq") {
        // Force MCQ and single correct answer
        q.type = "MCQ";
        if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1) {
          q.correctAnswers = [q.correctAnswers[0]];
        }
        if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
          q.correctAnswers = [q.options[0]?.optionId].filter(Boolean);
        }
      } else if (mode === "multi") {
        // Force MULTI_SELECT and at least two correct answers
        q.type = "MULTI_SELECT";
        if (!Array.isArray(q.correctAnswers)) q.correctAnswers = [];
        // Ensure at least two correct answers; pick additional options if needed
        if (q.correctAnswers.length < 2) {
          const existing = new Set(q.correctAnswers.map(String));
          for (let i = 0; i < q.options.length && existing.size < 2; i++) {
            existing.add(q.options[i].optionId);
          }
          q.correctAnswers = Array.from(existing).slice(0, 2);
        }
      }
    });

    return res.json({ questions });
  } catch (err) {
    console.error("generateQuiz error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// chatbot controller
const handleChatRequest = async (req, res, next) => {
  try {
    const { message, role, page, isAuthenticated } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const isUserAuthenticated = !!req.user || !!isAuthenticated;
    const effectiveRole = isUserAuthenticated ? role : "guest";

    if (!effectiveRole) {
      return res.status(400).json({
        success: false,
        error: "User role is required",
      });
    }

    // Check intent first to determine if we need memory
    const intent = detectIntent(message);
    let previousContext = null;

    // For GENERAL mode only: check for follow-up questions and retrieve memory
    if (intent === "GENERAL") {
      const userId = getUserIdentifier(req);

      if (isFollowUpQuestion(message)) {
        previousContext = getMemory(userId);
        if (previousContext) {
          console.log(`[MEMORY] Retrieved context for ${userId}`);
        }
      }
    }

    const {
      prompt,
      intent: detectedIntent,
      maxTokens,
    } = buildChatPrompt({
      role: effectiveRole,
      page: page || "general",
      message,
      isAuthenticated: isUserAuthenticated,
      previousContext,
    });

    console.log(
      `[AI MODE] ${detectedIntent} | maxTokens: ${maxTokens}${previousContext ? " | with-context" : ""}`,
    );

    const aiResponse = await generateAIResponse(prompt, {
      temperature: 0.3,
      maxTokens,
    });

    // For GENERAL mode: extract summary and store memory
    let finalResponse = aiResponse;
    if (detectedIntent === "GENERAL") {
      const userId = getUserIdentifier(req);
      const { summary, cleanResponse } = extractSummary(aiResponse);

      storeMemory(userId, message, summary);
      finalResponse = cleanResponse;

      console.log(`[MEMORY] Stored summary for ${userId}`);
    }

    res.status(200).json({
      success: true,
      data: {
        message: finalResponse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Chat Request Error:", error);
    next(error);
  }
};

const handleInsightsRequest = async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: "Insights feature coming soon",
  });
};

const handleHealthCheck = async (req, res, next) => {
  try {
    const isHealthy = await checkAIHealth();

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      service: "AI Service",
      status: isHealthy ? "operational" : "degraded",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Health Check Error:", error);
    res.status(503).json({
      success: false,
      service: "AI Service",
      status: "unavailable",
      error: error.message,
    });
  }
};

module.exports = {
  generateQuiz,
  handleChatRequest,
  handleInsightsRequest,
  handleHealthCheck,
};
