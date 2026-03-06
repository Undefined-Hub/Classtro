// schemas/analyticsSchemas.js
const { z } = require("zod");

// Schema for analytics generation request
const generateAnalyticsSchema = z.object({
  sections: z.object({
    participants: z.boolean().optional().default(true),
    timeline: z.boolean().optional().default(true),
    polls: z.boolean().optional().default(true),
    qna: z.boolean().optional().default(true),
    attendance: z.boolean().optional().default(true),
    feedback: z.boolean().optional().default(true),
    ai: z.boolean().optional().default(false),
  }).optional().default({}),
});

// Schema for session ID validation
const sessionIdSchema = z.object({
  sessionId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid sessionId"),
});

module.exports = {
  generateAnalyticsSchema,
  sessionIdSchema,
};