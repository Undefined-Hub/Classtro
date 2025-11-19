const { z } = require("zod");

// Base schema for common fields
const baseFeedbackSchema = z.object({
  type: z.enum(["bug", "feedback"], {
    required_error: "Type is required",
    invalid_type_error: 'Type must be either "bug" or "feedback"',
  }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(2000, "Description must not exceed 2000 characters")
    .trim(),
  screenshot: z.string().optional().nullable(),
  metadata: z
    .object({
      userAgent: z.string().optional().default(""),
      appVersion: z.string().optional().default("1.0.0"),
      viewport: z.string().optional().default(""),
      url: z.string().optional().default(""), // Accept any string (full URL or relative path)
      timestamp: z.string().optional().default(""),
      console: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({}),
});

// Bug report schema - requires title, email and additional fields
const bugReportSchema = baseFeedbackSchema.extend({
  type: z.literal("bug"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  stepsToReproduce: z
    .string()
    .min(5, "Steps to reproduce must be at least 5 characters long")
    .max(1000, "Steps to reproduce must not exceed 1000 characters")
    .trim(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  userEmail: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required for bug reports")
    .trim()
    .toLowerCase(),
});

// Feedback schema - email is optional, rating is required
const feedbackSchema = baseFeedbackSchema.extend({
  type: z.literal("feedback"),
  rating: z
    .number({
      required_error: "Rating is required for feedback",
      invalid_type_error: "Rating must be a number",
    })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating must be at most 5 stars"),
  userEmail: z
    .union([
      z
        .string()
        .email("Please provide a valid email address")
        .trim()
        .toLowerCase(),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => {
      if (!val || val === "") return null;
      return val;
    }),
});

// Main validation schema that discriminates between bug and feedback
const feedbackValidationSchema = z.discriminatedUnion("type", [
  bugReportSchema,
  feedbackSchema,
]);

// Schema for updating feedback status (admin use)
const updateStatusSchema = z.object({
  status: z.enum(["new", "in-progress", "resolved", "closed"], {
    required_error: "Status is required",
    invalid_type_error: "Invalid status value",
  }),
});

// Schema for query parameters
const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  type: z.enum(["bug", "feedback"]).optional(),
  status: z.enum(["new", "in-progress", "resolved", "closed"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

module.exports = {
  feedbackValidationSchema,
  bugReportSchema,
  feedbackSchema,
  updateStatusSchema,
  querySchema,
};
