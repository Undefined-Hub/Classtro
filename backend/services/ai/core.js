require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate AI response - Provider-agnostic design for future AWS Bedrock migration
 * Includes automatic retry mechanism for 503/UNAVAILABLE errors
 * @param {string} prompt - The formatted prompt
 * @param {object} options - Generation configuration
 * @returns {Promise<string>} AI response text or friendly fallback message
 */
async function generateAIResponse(prompt, options = {}) {
  const MAX_RETRIES = 0;
  const RETRY_DELAY_MS = 1000;

  const {
    model = "gemini-2.5-flash-lite",
    maxTokens = 130,
    temperature = 0.3,
  } = options;

  // Input validation - fail fast without retry
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Invalid prompt");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  /**
   * Extract numeric HTTP status from various error shapes returned by @google/genai
   */
  const getErrorStatus = (error) => {
    return (
      error.status ||
      error.response?.status ||
      error.error?.code ||
      (typeof error.message === 'string' && parseInt(error.message.match(/\b(4\d{2}|5\d{2})\b/)?.[0])) ||
      null
    );
  };

  /**
   * Log full error details safely for debugging
   */
  const logError = (attempt, error) => {
    const status = getErrorStatus(error);
    console.error(`[AI ERROR] ✗ Attempt ${attempt}/${MAX_RETRIES + 1} failed`);
    console.error(`  error.status         : ${error.status ?? 'N/A'}`);
    console.error(`  error.response.status: ${error.response?.status ?? 'N/A'}`);
    console.error(`  error.error.code     : ${error.error?.code ?? 'N/A'}`);
    console.error(`  Resolved status      : ${status ?? 'unknown'}`);
    console.error(`  Message              : ${error.message}`);
    try {
      // Safely print full error without circular reference issues
      console.error(`  Full error (JSON)    :`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch {
      console.error(`  Full error (raw)     :`, error);
    }
  };

  /**
   * Check if error should trigger a retry (only 503 and network errors)
   * NOTE: Do NOT retry 429 - retrying rate limits makes the problem worse!
   */
  const isRetryableError = (error) => {
    const status = getErrorStatus(error);
    return (
      status === 503 ||  // Service temporarily unavailable
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('UNAVAILABLE')
    );
  };

  /**
   * Return user-friendly fallback message based on error type
   */
  const getFallbackMessage = (error) => {
    const status = getErrorStatus(error);
    if (status === 429) {
      return "⚠️ Clario is receiving too many requests right now. Please wait a moment and try again.";
    }
    if (status === 503) {
      return "⚠️ Clario's AI service is temporarily unavailable due to high traffic. Please try again shortly.";
    }
    if (status === 404) {
      return "⚠️ Clario encountered a configuration issue. Please contact support if this persists.";
    }
    return "⚠️ Clario is having trouble responding right now. Please try again in a moment.";
  };

  // Retry loop: Total attempts = MAX_RETRIES + 1 (initial attempt)
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      // Generate unique request ID for tracing
      const reqId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      console.log(`[AI TRACE] PID:${process.pid} CALL reqId:${reqId} ts:${new Date().toISOString()} model:${model}`);

      // Log prompt details for debugging
      console.log(`[AI DEBUG] prompt.length: ${prompt.length} chars, model: ${model}, maxTokens: ${options.maxTokens || maxTokens}`);
      console.log("Final Prompt Length:", prompt.length);

      // Call Gemini with full prompt and knowledge injection
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty AI response");
      }

      if (attempt > 1) {
        console.log(`[AI SUCCESS] ✓ Response received on attempt ${attempt}`);
      }

      return text;

    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES + 1;
      const status = getErrorStatus(error);

      logError(attempt, error);

      // 429: rate limit - return immediately (retrying makes it worse!)
      if (status === 429) {
        console.error(`[AI FALLBACK] ✗ Rate limited (429). Not retrying to avoid consuming more quota.`);
        return getFallbackMessage(error);
      }

      // 404: wrong model name - no point retrying
      if (status === 404) {
        console.error(`[AI FALLBACK] ✗ Model not found (404). Check model name: "${model}"`);
        return getFallbackMessage(error);
      }

      // 400: bad request - no point retrying
      if (status === 400) {
        console.error(`[AI FALLBACK] ✗ Bad request (400). Check prompt format.`);
        return getFallbackMessage(error);
      }

      // Retry only for 503 / network errors
      if (isRetryableError(error) && !isLastAttempt) {
        console.log(`[AI RETRY] ⟳ Retrying (${status ?? 'network error'}) in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }

      console.error(
        `[AI FALLBACK] ⚠️  ${isLastAttempt ? 'All retries exhausted' : 'Non-retryable error'} (status: ${status ?? 'unknown'}).`
      );
      return getFallbackMessage(error);
    }
  }
}

async function checkAIHealth() {
  try {
    const testResponse = await generateAIResponse("Say OK", {
      maxTokens: 10,
      temperature: 0,
    });
    return testResponse.toLowerCase().includes("ok");
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateAIResponse,
  checkAIHealth,
};
