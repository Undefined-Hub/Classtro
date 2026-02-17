require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate AI response - Provider-agnostic design for future AWS Bedrock migration
 * @param {string} prompt - The formatted prompt
 * @param {object} options - Generation configuration
 * @returns {Promise<string>} AI response text
 */
async function generateAIResponse(prompt, options = {}) {
  try {
    const {
      model = "gemini-3-flash-preview",
      maxTokens = 300, // Optimized for concise responses
      temperature = 0.3, // Lower temperature for consistency
    } = options;

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

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

    return text;

  } catch (error) {
    console.error("AI Error:", error.message);
    throw new Error(`AI generation failed: ${error.message}`);
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
