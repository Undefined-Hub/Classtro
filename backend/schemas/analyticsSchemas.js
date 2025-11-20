// schemas/analyticsSchemas.js
const Joi = require("joi");

// Schema for analytics generation request
const generateAnalyticsSchema = Joi.object({
  sections: Joi.object({
    participants: Joi.boolean().optional().default(true),
    timeline: Joi.boolean().optional().default(true),
    polls: Joi.boolean().optional().default(true),
    qna: Joi.boolean().optional().default(true),
    attendance: Joi.boolean().optional().default(true),
    feedback: Joi.boolean().optional().default(true),
    ai: Joi.boolean().optional().default(false),
  }).optional().default({}),
});

// Schema for session ID validation
const sessionIdSchema = Joi.object({
  sessionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

module.exports = {
  generateAnalyticsSchema,
  sessionIdSchema,
};