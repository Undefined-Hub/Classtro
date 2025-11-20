const z = require("zod");

// Schema for submitting session feedback
const submitSessionFeedbackSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

// Schema for session ID parameter validation
const sessionIdParamSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid session ID format"),
});

module.exports = {
  submitSessionFeedbackSchema,
  sessionIdParamSchema,
};
