// controllers/roomController.js
const Room = require("../models/Room");
const Session = require("../models/Session");
const Participant = require("../models/Participant");
const { validateInput } = require("../utils/validateInput");
const {
  createRoomSchema,
  listRoomsQuerySchema,
  roomIdParamSchema,
  updateRoomSchema,
  listRoomSessionsQuerySchema,
} = require("../schemas/roomSchemas");

/**
 * Create a new room
 * POST /api/rooms
 * Teacher only
 */
const createRoom = async (req, res, next) => {
  try {
    const data = validateInput(createRoomSchema, req.body);

    const room = await Room.create({
      name: data.name,
      description: data.description || "",
      defaultMaxStudents: data.defaultMaxStudents || 200,
      teacherId: req.user.id, // comes from JWT middleware
    });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

/**
 * List rooms for the current teacher (paginated)
 * GET /api/rooms?page=1&limit=10
 */
const listRooms = async (req, res, next) => {
  try {
    const query = validateInput(listRoomsQuerySchema, req.query);

    // Filter condition to exclude archived rooms
    const filterCondition = { 
      teacherId: req.user.id,
      archivedAt: { $exists: false } // Only get non-archived rooms
    };

    // Count total non-archived rooms first
    const total = await Room.countDocuments(filterCondition);

    // Calculate totalPages
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    // Adjust page if it exceeds totalPages
    const page = Math.min(query.page, totalPages);

    // Calculate skip with adjusted page
    const skip = (page - 1) * query.limit;

    // Fetch rooms with adjusted skip
    const rooms = await Room.find(filterCondition)
      .skip(skip)
      .limit(query.limit)
      .sort({ createdAt: -1 });

    res.json({
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: query.limit,
        totalItems: total,
      },
      rooms,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get room details by ID
 * GET /api/rooms/:roomId
 */
const getRoomById = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);

    const room = await Room.findById(params.roomId);

    if (!room) {
      const error = new Error("Room not found");
      error.status = 404;
      throw error;
    }

    res.json(room);
  } catch (err) {
    next(err);
  }
};

/**
 * Update room metadata (teacher only)
 * PATCH /api/rooms/:roomId
 */
const updateRoom = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);
    const data = validateInput(updateRoomSchema, req.body);

    const room = await Room.findOneAndUpdate(
      { _id: params.roomId, teacherId: req.user.id },
      { $set: data, updatedAt: new Date() },
      { new: true },
    );

    if (!room) {
      const error = new Error("Room not found or not owned by you");
      error.status = 404;
      throw error;
    }

    res.json(room);
  } catch (err) {
    next(err);
  }
};

/**
 * Soft-delete / archive a room
 * PUT /api/rooms/:roomId
 */
const archiveRoom = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);

    const room = await Room.findOneAndUpdate(
      { _id: params.roomId, teacherId: req.user.id },
      { $set: { archivedAt: new Date() } },
      { new: true },
    );

    if (!room) {
      const error = new Error("Room not found or not owned by you");
      error.status = 404;
      throw error;
    }

    res.json({ message: "Room archived successfully", room });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rooms/:roomId/unarchive
const unarchiveRoom = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);

    const room = await Room.findOneAndUpdate(
      { _id: params.roomId, teacherId: req.user.id },
      { $set: { archivedAt: null } },
      { new: true },
    );

    if (!room) {
      const error = new Error("Room not found or not owned by you");
      error.status = 404;
      throw error;
    }

    res.json({ message: "Room unarchived successfully", room });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rooms/:roomId/hard
const hardDeleteRoom = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);

    // Delete sessions + participants linked to this room
    await Session.deleteMany({ roomId: params.roomId });
    await Participant.deleteMany({ roomId: params.roomId });

    // Finally delete the room
    const room = await Room.findOneAndDelete({
      _id: params.roomId,
      teacherId: req.user.id,
    });

    if (!room) {
      const error = new Error("Room not found or not owned by you");
      error.status = 404;
      throw error;
    }

    res.json({ message: "Room permanently deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * List sessions of a room (teacher or student)
 * GET /api/rooms/:roomId/sessions
 */
const listRoomSessions = async (req, res, next) => {
  try {
    const params = validateInput(roomIdParamSchema, req.params);
    const query = validateInput(listRoomSessionsQuerySchema, req.query);

    const filter = { roomId: params.roomId };
    if (query.active !== undefined) {
      filter.isActive = query.active;
    }

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit);

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

/**
 * Get archived rooms for a specific user (teacher)
 * GET /api/rooms/:userId/archives?page=1&limit=10
 */
const getArchivedRoomsByUserId = async (req, res, next) => {
  try {
    // Validate query parameters for pagination
    const query = validateInput(listRoomsQuerySchema, req.query);
    const { userId } = req.params;

    // Validate that the user is requesting their own archived rooms or has admin access
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      const error = new Error("Unauthorized access to user's archived rooms");
      error.status = 403;
      throw error;
    }

    // Filter condition to get only archived rooms for the user
    const filterCondition = { 
      teacherId: userId,
      archivedAt: { $exists: true } // Only get archived rooms
    };

    // Count total archived rooms
    const total = await Room.countDocuments(filterCondition);

    // Calculate totalPages
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    // Adjust page if it exceeds totalPages
    const page = Math.min(query.page, totalPages);

    // Calculate skip with adjusted page
    const skip = (page - 1) * query.limit;

    // Fetch archived rooms with pagination
    const archivedRooms = await Room.find(filterCondition)
      .skip(skip)
      .limit(query.limit)
      .sort({ archivedAt: -1 }) // Sort by most recently archived first
      .select('name description defaultMaxStudents teacherId createdAt archivedAt updatedAt');

    res.json({
      success: true,
      message: "Archived rooms retrieved successfully",
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: query.limit,
        totalItems: total,
      },
      rooms: archivedRooms,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRoom,
  listRooms,
  getRoomById,
  updateRoom,
  archiveRoom,
  unarchiveRoom,
  listRoomSessions,
  hardDeleteRoom,
  getArchivedRoomsByUserId,
};
