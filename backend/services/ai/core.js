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
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1000;

  const {
    model = "gemini-3-flash-preview",
    maxTokens = 300, // Optimized for concise responses
    temperature = 0.3, // Lower temperature for consistency
  } = options;

  // Input validation - fail fast without retry
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Invalid prompt");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  /**
   * Check if error should trigger retry
   * @param {Error} error - The error object
   * @returns {boolean} True if error is temporary/retryable
   */
  const isRetryableError = (error) => {
    return (
      error.status === 503 ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('503') ||
      error.message?.includes('UNAVAILABLE')
    );
  };

  // Retry loop: Total attempts = MAX_RETRIES + 1 (initial attempt)
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      // Call Gemini with optimized config
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

      // Success - log if retry was needed
      if (attempt > 1) {
        console.log(`[AI SUCCESS] ✓ Response received on attempt ${attempt}`);
      }

      return text;

    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES + 1;

      // Log detailed error information
      console.error(
        `[AI ERROR] ✗ Attempt ${attempt}/${MAX_RETRIES + 1} failed\n` +
        `  Status: ${error.status || 'N/A'}\n` +
        `  Code: ${error.code || 'N/A'}\n` +
        `  Message: ${error.message}`
      );

      // Retry logic for temporary errors
      if (isRetryableError(error) && !isLastAttempt) {
        console.log(`[AI RETRY] ⟳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue; // Retry
      }

      // All retries exhausted or non-retryable error
      console.error(
        `[AI FALLBACK] ⚠️  ${isLastAttempt ? 'All retries exhausted' : 'Non-retryable error'}. ` +
        `Returning friendly fallback message.`
      );

      // Return friendly message instead of throwing
      return "⚠️ Our AI assistant is currently experiencing high traffic. Please try again in a moment.";
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
