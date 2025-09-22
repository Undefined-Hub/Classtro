const { z } = require("zod");

// Schema for creating a room
const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters"),
  description: z.string().optional(),
  defaultMaxStudents: z.number().min(1).max(1000).optional(),
});

// Schema for pagination query (?page=1&limit=10)
const listRoomsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
});

// Schema for validating :roomId param
const roomIdParamSchema = z.object({
  roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid roomId"),
});

// ✅ New: update room schema
const updateRoomSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  defaultMaxStudents: z.number().min(1).max(1000).optional(),
});

// ✅ New: query schema for listRoomSessions
const listRoomSessionsQuerySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
});

module.exports = {
  createRoomSchema,
  listRoomsQuerySchema,
  roomIdParamSchema,
  updateRoomSchema,
  listRoomSessionsQuerySchema,
};
