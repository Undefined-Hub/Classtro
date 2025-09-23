const { z } = require("zod");

const PollOptionSchema = z.object({
    text: z.string(),
    votes: z.number().int().nonnegative().default(0),
});

const PollSchema = z.object({
    sessionId: z.string().regex(/^[a-f\d]{24}$/i), // MongoDB ObjectId
    question: z.string(),
    options: z.array(PollOptionSchema),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    closedAt: z.date().optional().nullable(),
});

module.exports = {
    PollSchema,
    PollOptionSchema,
};