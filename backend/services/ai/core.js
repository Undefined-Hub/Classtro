require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

/**
 * AI Core Service
 * 
 * Single source of truth for all AI operations in Classtro.
 * This module handles communication with the AI provider (currently Google Gemini).
 * 
 * Design Philosophy:
 * - Provider-agnostic interface
 * - Centralized error handling
 * - Easy to swap AI providers (Gemini -> AWS Bedrock, etc.)
 * - No business logic - only AI communication
 */

// Initialize AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate AI response from a given prompt
 * 
 * @param {string} prompt - The complete prompt to send to AI
 * @param {Object} options - Optional configuration
 * @param {string} options.model - AI model to use (default: gemini-3-flash-preview)
 * @param {number} options.maxTokens - Maximum tokens in response
 * @param {number} options.temperature - Creativity level (0-1)
 * @returns {Promise<string>} AI generated response
 * @throws {Error} If AI generation fails
 */
async function generateAIResponse(prompt, options = {}) {
  try {
    const {
      model = "gemini-3-flash-preview",
      maxTokens = 2048,
      temperature = 0.7,
    } = options;

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt: must be a non-empty string");
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured in environment variables");
    }

    // Call AI provider
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      // Additional configuration can be added here
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    });

    // Extract and return text
    const text = response.text;

    if (!text) {
      throw new Error("AI provider returned empty response");
    }

    return text;

  } catch (error) {
    // Enhanced error handling
    console.error("AI Core Error:", error.message);

    // Provide user-friendly error messages
    if (error.message.includes("API key")) {
      throw new Error("AI service configuration error. Please contact support.");
    }

    if (error.message.includes("quota") || error.message.includes("rate limit")) {
      throw new Error("AI service temporarily unavailable. Please try again later.");
    }

    if (error.message.includes("network") || error.message.includes("timeout")) {
      throw new Error("AI service connection failed. Please check your internet connection.");
    }

    // Re-throw with context
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Health check for AI service
 * 
 * @returns {Promise<boolean>} True if AI service is operational
 */
async function checkAIHealth() {
  try {
    const testResponse = await generateAIResponse("Say 'OK' if you can hear me.", {
      maxTokens: 10,
      temperature: 0,
    });
    return testResponse.toLowerCase().includes("ok");
  } catch (error) {
    console.error("AI Health Check Failed:", error.message);
    return false;
  }
}

module.exports = {
  generateAIResponse,
  checkAIHealth,
};
