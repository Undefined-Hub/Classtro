require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateAIResponse(prompt, options = {}) {
  try {
    const {
      model = "gemini-3-flash-preview",
      maxTokens = 2048,
      temperature = 0.7,
    } = options;

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }
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
