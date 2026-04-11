const Session = require("../models/Session");
const BroadcastAnalytics = require("../models/BroadcastAnalytics");
const { fetchMultipleUrlMetadata } = require("../utils/urlMetadata");
const { getSessionNamespace } = require("../socket");
const path = require("path");

/**
 * Extract URLs from text message
 */
const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
};

/**
 * Determine file type from mimetype
 */
const getFileType = (mimetype) => {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype === "application/vnd.ms-powerpoint") return "ppt";
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "pptx";
  if (mimetype.startsWith("image/")) return "image";
  return "unknown";
};

/**
 * Add a broadcast message to a session
 * POST /api/sessions/:sessionId/broadcasts?fetchMetadata=true
 * Supports file uploads via multipart/form-data
 */
exports.addBroadcast = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const fetchMetadata = req.query.fetchMetadata === "true";
    const uploadedFiles = req.files || []; // Multer adds files array

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is the session host
    if (session.teacherId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the session host can send broadcasts" });
    }

    // Extract URLs from message
    const urls = extractUrls(message.trim());

    // Optionally fetch metadata for URLs
    let urlMetadata = null;
    if (fetchMetadata && urls.length > 0) {
      try {
        urlMetadata = await fetchMultipleUrlMetadata(urls);
      } catch (error) {
        console.error("Failed to fetch URL metadata:", error);
        // Continue without metadata if fetch fails
      }
    }

    // Process uploaded files
    const files = uploadedFiles.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      type: getFileType(file.mimetype),
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/broadcasts/${file.filename}`,
      uploadedAt: new Date(),
    }));

    // Add broadcast to session
    const broadcast = {
      message: message.trim(),
      urls,
      urlMetadata,
      files,
      timestamp: new Date(),
    };

    session.broadcasts.push(broadcast);
    await session.save();

    // Get the newly added broadcast (last item in array)
    const addedBroadcast = session.broadcasts[session.broadcasts.length - 1];

    res.status(201).json({
      message: "Broadcast sent successfully",
      broadcast: addedBroadcast,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all broadcasts for a session
 * GET /api/sessions/:sessionId/broadcasts
 */
exports.getBroadcasts = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId).select("broadcasts");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Sort broadcasts by timestamp (newest first)
    const broadcasts = session.broadcasts.sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    res.json({
      broadcasts,
      count: broadcasts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific broadcast
 * DELETE /api/sessions/:sessionId/broadcasts/:broadcastId
 */
exports.deleteBroadcast = async (req, res, next) => {
  try {
    const { sessionId, broadcastId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is the session host
    if (session.teacherId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the session host can delete broadcasts" });
    }

    // Find and remove the broadcast
    const broadcastIndex = session.broadcasts.findIndex(
      (b) => b._id.toString() === broadcastId,
    );

    if (broadcastIndex === -1) {
      return res.status(404).json({ message: "Broadcast not found" });
    }

    session.broadcasts.splice(broadcastIndex, 1);
    await session.save();

    res.json({ message: "Broadcast deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or toggle a reaction to a broadcast
 * POST /api/sessions/:sessionId/broadcasts/:broadcastId/react
 * Body: { emoji: "👍" }
 */
exports.addReaction = async (req, res, next) => {
  try {
    const { sessionId, broadcastId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    // Validate emoji (only allow specific reactions)
    const allowedEmojis = ["👍", "❤️", "🎉", "✅"];
    if (!allowedEmojis.includes(emoji)) {
      return res
        .status(400)
        .json({ message: "Invalid emoji. Allowed: 👍, ❤️, 🎉, ✅" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Find the broadcast
    const broadcast = session.broadcasts.id(broadcastId);
    if (!broadcast) {
      return res.status(404).json({ message: "Broadcast not found" });
    }

    // Initialize reactions array if it doesn't exist
    if (!broadcast.reactions) {
      broadcast.reactions = [];
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = broadcast.reactions.findIndex(
      (r) => r.userId.toString() === req.user.id && r.emoji === emoji,
    );

    let action = "added";
    if (existingReactionIndex !== -1) {
      // Remove reaction (toggle off)
      broadcast.reactions.splice(existingReactionIndex, 1);
      action = "removed";
    } else {
      // Add new reaction
      broadcast.reactions.push({
        emoji,
        userId: req.user.id,
        userName: req.user.name || req.user.email,
        timestamp: new Date(),
      });
    }

    await session.save();

    // Update analytics
    try {
      let analytics = await BroadcastAnalytics.findOne({
        sessionId,
        broadcastId,
      });

      if (!analytics) {
        analytics = new BroadcastAnalytics({
          sessionId,
          broadcastId,
          message: broadcast.message,
        });
      }

      if (action === "added") {
        // Increment reaction count
        analytics.reactionStats[emoji] =
          (analytics.reactionStats[emoji] || 0) + 1;
        analytics.reactionDetails.push({
          emoji,
          userId: req.user.id,
          userName: req.user.name || req.user.email,
          reactedAt: new Date(),
        });
      } else if (action === "removed") {
        // Decrement reaction count
        analytics.reactionStats[emoji] = Math.max(
          0,
          (analytics.reactionStats[emoji] || 0) - 1,
        );
        analytics.reactionDetails = analytics.reactionDetails.filter(
          (r) => !(r.userId.toString() === req.user.id && r.emoji === emoji),
        );
      }

      await analytics.save();
    } catch (error) {
      console.error("Failed to update broadcast analytics:", error);
      // Don't throw, let the broadcast reaction succeed even if analytics fails
    }

    // Emit socket event to notify all participants about the reaction
    try {
      const sessionNamespace = getSessionNamespace();
      if (sessionNamespace) {
        const session_data = await Session.findById(sessionId);
        if (!session_data) {
          console.error("[REACTION] Session not found for socket emit");
          return res.json({ message: "Reaction updated" });
        }

        const roomName = `session:${session_data.code}`;

        // Get room info for debugging
        const roomSockets = await sessionNamespace.in(roomName).fetchSockets();
        console.log("[REACTION] Room info:", {
          roomName,
          sessionCode: session_data.code,
          socketsInRoom: roomSockets.length,
          socketIds: roomSockets.map((s) => s.id),
        });

        const payload = {
          broadcastId,
          emoji,
          userId: req.user.id,
          userName: req.user.name || req.user.email,
          action,
          reactions: broadcast.reactions, // Send full reactions array as backup
        };

        console.log(
          "[REACTION] Emitting broadcast:reaction-update to room:",
          roomName,
          payload,
        );

        sessionNamespace
          .to(roomName)
          .emit("broadcast:reaction-update", payload);

        console.log(
          "[REACTION] Event emitted successfully to",
          roomSockets.length,
          "participants",
        );
      } else {
        console.error("[REACTION] Socket namespace not available");
      }
    } catch (error) {
      console.error("Failed to emit reaction socket event:", error);
      // Don't throw, let the broadcast reaction succeed even if socket fails
    }

    res.json({
      message: `Reaction ${action} successfully`,
      action,
      broadcast: broadcast.toObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track broadcast view
 * POST /api/sessions/:sessionId/broadcasts/:broadcastId/view
 */
exports.trackView = async (req, res, next) => {
  try {
    const { sessionId, broadcastId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const broadcast = session.broadcasts.id(broadcastId);
    if (!broadcast) {
      return res.status(404).json({ message: "Broadcast not found" });
    }

    // Initialize views array if it doesn't exist
    if (!broadcast.views) {
      broadcast.views = [];
    }

    // Check if user already viewed this broadcast
    const alreadyViewed = broadcast.views.some(
      (v) => v.userId && v.userId.toString() === req.user.id,
    );

    if (!alreadyViewed) {
      broadcast.views.push({
        userId: req.user.id,
        userName: req.user.name || req.user.email,
        viewedAt: new Date(),
      });

      await session.save();
    }

    // Update analytics
    try {
      let analytics = await BroadcastAnalytics.findOne({
        sessionId,
        broadcastId,
      });

      if (!analytics) {
        analytics = new BroadcastAnalytics({
          sessionId,
          broadcastId,
          message: broadcast.message,
        });
      }

      analytics.totalViews = (broadcast.views || []).length;
      analytics.viewedByUsers = (broadcast.views || []).map((v) => ({
        userId: v.userId,
        userName: v.userName,
        viewedAt: v.viewedAt,
      }));

      await analytics.save();
    } catch (error) {
      console.error("Failed to update broadcast view analytics:", error);
      // Don't throw, let the view tracking succeed even if analytics fails
    }

    res.json({ message: "View tracked successfully" });
  } catch (error) {
    next(error);
  }
};
