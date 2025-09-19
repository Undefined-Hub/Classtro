const Session = require("../models/Session");
const Room = require("../models/Room");
const Participant = require("../models/Participant");
const { validateInput } = require("../utils/validateInput");
const crypto = require("crypto");
const {
  sessionIdParamSchema,
  roomIdParamSchema,
  sessionCodeParamSchema,
  createSessionSchema,
  listActiveSessionsQuerySchema,
  updateSessionSchema,
  joinSessionSchema,
  leaveSessionSchema,
  participantIdParamSchema
} = require("../schemas/sessionSchema");

// Helper: generate random session code
function generateCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char
}

/**
 * Create a standalone session (not linked to a room)
 * POST /api/sessions
 * Teacher only
 */
const createSessionStandalone = async (req, res, next) => {
  try {
    const data = validateInput(createSessionSchema, req.body);
    console.log("Creating standalone session with data:", data);
    const code = generateCode();

    const session = await Session.create({
      title: data.title,
      teacherId: req.user.id,
      code,
      maxStudents: data.maxStudents || 200,
      metadata: data.metadata || {},
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a session under a specific room
 * POST /api/rooms/:roomId/sessions
 * Teacher only
 */
const createSessionInRoom = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);
    const data = validateInput(createSessionSchema, req.body);

    const room = await Room.findOne({
      _id: params.roomId,
      teacherId: req.user.id,
    });
    if (!room) {
      return res.status(404).json({ error: "Room not found or not owned by you" });
    }

    const code = generateCode();

    const session = await Session.create({
      roomId: room._id,
      teacherId: req.user.id,
      title: data.title,
      code,
      maxStudents: data.maxStudents || room.defaultMaxStudents,
      metadata: data.metadata || {},
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * Get session metadata by join code (public)
 * GET /api/sessions/code/:code
 */
const getSessionByCode = async (req, res, next) => {
  try {
    const params = validateInput(sessionCodeParamSchema, req.params);

    const session = await Session.findOne({
      code: params.code,
      isActive: true,
    }).select("title code roomId isActive startAt createdAt");

    if (!session) {
      return res.status(404).json({ error: "Session not found or inactive" });
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * Get session details by sessionId (teacher only)
 * GET /api/sessions/:sessionId
 */
const getSessionById = async (req, res, next) => {
  try {
    console.log("Fetching session for user:", req.user);
    const params = validateInput(sessionIdParamSchema, req.params);

    const session = await Session.findOne({
      _id: params.sessionId,
      teacherId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found or not owned by you" });
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * List active sessions (public / filters)
 *  GET /api/sessions/active?teacherId=&roomId=&limit=
 */
const listActiveSessions = async (req, res, next) => {
  try {
    const query = validateInput(listActiveSessionsQuerySchema, req.query);

    const filter = { isActive: true };
    if (query.teacherId) filter.teacherId = query.teacherId;
    if (query.roomId) filter.roomId = query.roomId;

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .select("title code roomId teacherId isActive startAt createdAt");

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

/**
 * Close a session (teacher only)
 * POST /api/sessions/:code/close
 */
const closeSession = async (req, res, next) => {
  try {
    const params = validateInput(sessionCodeParamSchema, req.params);

    const session = await Session.findOneAndUpdate(
      { code: params.code, teacherId: req.user.id },
      { $set: { isActive: false, endAt: new Date() } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found or not owned by you" });
    }

    res.json({ message: "Session closed successfully", session });
  } catch (err) {
    next(err);
  }
};

/**
 * Update session metadata (teacher only)
 * PATCH /api/sessions/:sessionId
 */
const updateSession = async (req, res, next) => {
  try {
    const params = validateInput(sessionIdParamSchema, req.params);
    const data = validateInput(updateSessionSchema, req.body);

    const session = await Session.findOneAndUpdate(
      { _id: params.sessionId, teacherId: req.user.id },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found or not owned by you" });
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * Student joins a session
 * POST /api/sessions/:code/join
 */
const joinSession = async (req, res, next) => {
  try {

    const params = validateInput(sessionCodeParamSchema, req.params);
    const data = validateInput(joinSessionSchema, req.body);
    console.log("Join request data:", data);
    const session = await Session.findOne({
      code: params.code,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found or inactive" });
    }

    // enforce max student count
    const currentCount = await Participant.countDocuments({
      sessionId: session._id,
      leftAt: { $exists: false },
    });

    if (currentCount >= session.maxStudents) {
      return res.status(403).json({ error: "Session is full" });
    }

    // Prevent duplicate participant records for same user in a session
    const userId = data.userId || (req.user ? req.user.id : null);
    let participant = null;
    if (userId) {
      participant = await Participant.findOne({
        sessionId: session._id,
        userId: userId,
      });
      if (participant) {
        // If participant had left, rejoin (clear leftAt, update joinAt)
        if (participant.leftAt) {
          participant.leftAt = undefined;
          participant.joinedAt = new Date();
          participant.isActive = true;
          await participant.save();
        }
        return res.status(200).json({
          message: "Already joined",
          participantId: participant._id,
          participantJoinedAt: participant.joinedAt
        });
      }
    }

    // No existing participant, create new
    console.log("Creating participant record for:", req.user);
    participant = await Participant.create({
      roomId: session.roomId || null,
      sessionId: session._id,
      name: data.name,
      userId: userId,
      joinAt: new Date(),
      ip: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    // Later: issue short-lived join token for sockets
    res.status(201).json({
      message: "Joined successfully",
      participantId: participant._id,
      participantJoinedAt: participant.joinedAt
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Student leaves a session
 * POST /api/sessions/:code/leave
 */
const leaveSession = async (req, res, next) => {
  try {
    const params = validateInput(sessionCodeParamSchema, req.params);
    const data = validateInput(leaveSessionSchema, req.body);

    const session = await Session.findOne({ code: params.code });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await Participant.findOneAndUpdate(
      {
        _id: data.participantId,
        sessionId: session._id,
        leftAt: { $exists: false },
      },
      { $set: { leftAt: new Date(), isActive: false } }
    );

    res.json({ message: "Left session" });
  } catch (err) {
    next(err);
  }
};

/**
 * Get participants of a session (teacher only)
 * GET /api/sessions/:code/participants
 */
const getSessionParticipants = async (req, res, next) => {
  try {
    const params = validateInput(sessionCodeParamSchema, req.params);

    const session = await Session.findOne({
      code: params.code,
      teacherId: req.user.id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found or not owned by you" });
    }

    const participants = await Participant.find({ sessionId: session._id });
    res.json(participants);
  } catch (err) {
    next(err);
  }
};

/**
 * Get individual participant record
 * GET /api/sessions/participants/:participantId
 */
const getParticipantById = async (req, res, next) => {
  try {
    const params = validateInput(participantIdParamSchema, req.params);

    const participant = await Participant.findById(params.participantId);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // only teacher of that session or the participant himself
    if (
      !req.user ||
      (participant.userId?.toString() !== req.user.id &&
        participant.sessionId &&
        !(await Session.exists({
          _id: participant.sessionId,
          teacherId: req.user.id,
        })))
    ) {
      return res.status(403).json({ error: "Not authorized to view this participant" });
    }

    res.json(participant);
  } catch (err) {
    next(err);
  }
};
// roomId teacherId
// GET /api/sessions/monitor
const monitorSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .select("title code createdAt");

    // for each session, count participants
    const withCounts = await Promise.all(
      sessions.map(async (s) => {
        const count = await Participant.countDocuments({
          sessionId: s._id,
          leaveAt: { $exists: false },
        });
        return { ...s.toObject(), activeParticipants: count };
      })
    );

    res.json(withCounts);
  } catch (err) {
    next(err);
  }
};


module.exports = {
  createSessionStandalone,
  createSessionInRoom,
  getSessionByCode,
  getSessionById,
  listActiveSessions,
  closeSession,
  updateSession,
  joinSession,
  leaveSession,
  getSessionParticipants,
  getParticipantById,
  monitorSessions
};
