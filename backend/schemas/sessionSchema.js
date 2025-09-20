const { z } = require("zod");

// Common
const sessionIdParamSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid sessionId"),
});

const roomIdParamSchema = z.object({
  roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid roomId"),
});

const sessionCodeParamSchema = z.object({
  code: z.string().min(4).max(12), // join codes usually 6-8 chars, flexible
});

// For creating a session
const createSessionSchema = z.object({
  title: z.string().min(3, "Session title must be at least 3 characters"),
  maxStudents: z.number().min(1).max(1000).optional(),
  metadata: z.record(z.any()).optional(), // flexible JSON object
});

// For listing active sessions (filters via query)
const listActiveSessionsQuerySchema = z.object({
  teacherId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid teacherId")
    .optional(),
  roomId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid roomId")
    .optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
});

// For updating a session (teacher only)
const updateSessionSchema = z.object({
  title: z.string().min(3).optional(),
  maxStudents: z.number().min(1).max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

// Params
const participantIdParamSchema = z.object({
  participantId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid participantId"),
});

// For join request
const joinSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(), // if logged-in student
});

// For leave request
const leaveSessionSchema = z.object({
  participantId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

module.exports = {
  sessionIdParamSchema,
  roomIdParamSchema,
  sessionCodeParamSchema,
  listActiveSessionsQuerySchema,
  updateSessionSchema,
  createSessionSchema,
  participantIdParamSchema,
  joinSessionSchema,
  leaveSessionSchema,
};
