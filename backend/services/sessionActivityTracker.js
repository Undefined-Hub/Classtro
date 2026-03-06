// services/sessionActivityTracker.js
const SessionActivity = require("../models/SessionActivity");

/**
 * Track participant join activity
 * Call this from sessionController when user joins
 */
const trackJoinActivity = async (sessionId, participantId, userId, metadata = {}) => {
  try {
    await SessionActivity.create({
      sessionId,
      participantId,
      userId,
      activityType: "join",
      metadata: {
        ip: metadata.ip,
        deviceInfo: metadata.deviceInfo,
      },
    });
    console.log(`📊 Activity tracked: User ${userId || 'guest'} joined session ${sessionId}`);
  } catch (error) {
    console.error("Error tracking join activity:", error);
    // Don't throw - activity tracking shouldn't break main flow
  }
};

/**
 * Track participant leave activity
 * Call this from sessionController when user leaves
 */
const trackLeaveActivity = async (sessionId, participantId, userId, reason = "manual") => {
  try {
    await SessionActivity.create({
      sessionId,
      participantId,
      userId,
      activityType: "leave",
      metadata: {
        disconnectReason: reason,
      },
    });
    console.log(`📊 Activity tracked: User ${userId || 'guest'} left session ${sessionId}`);
  } catch (error) {
    console.error("Error tracking leave activity:", error);
  }
};

/**
 * Track participant kick activity
 * Call this when participant is kicked by teacher
 */
const trackKickActivity = async (sessionId, participantId, userId, kickedBy) => {
  try {
    await SessionActivity.create({
      sessionId,
      participantId,
      userId,
      activityType: "kicked",
      metadata: {
        disconnectReason: "kicked",
        kickedBy,
      },
    });
    console.log(`📊 Activity tracked: User ${userId || 'guest'} kicked from session ${sessionId}`);
  } catch (error) {
    console.error("Error tracking kick activity:", error);
  }
};

/**
 * Track participant reconnect activity
 * Call this when user rejoins after disconnect
 */
const trackReconnectActivity = async (sessionId, participantId, userId, metadata = {}) => {
  try {
    await SessionActivity.create({
      sessionId,
      participantId,
      userId,
      activityType: "reconnect",
      metadata: {
        ip: metadata.ip,
        deviceInfo: metadata.deviceInfo,
        disconnectReason: "reconnect",
      },
    });
    console.log(`📊 Activity tracked: User ${userId || 'guest'} reconnected to session ${sessionId}`);
  } catch (error) {
    console.error("Error tracking reconnect activity:", error);
  }
};

/**
 * Get session activity summary
 * Useful for debugging and monitoring
 */
const getSessionActivitySummary = async (sessionId) => {
  try {
    const activities = await SessionActivity.find({ sessionId })
      .sort({ timestamp: 1 })
      .populate("participantId", "name")
      .populate("userId", "name email");

    const summary = {
      totalActivities: activities.length,
      joinCount: activities.filter(a => a.activityType === "join").length,
      leaveCount: activities.filter(a => a.activityType === "leave").length,
      kickCount: activities.filter(a => a.activityType === "kicked").length,
      reconnectCount: activities.filter(a => a.activityType === "reconnect").length,
      activities: activities.map(a => ({
        type: a.activityType,
        timestamp: a.timestamp,
        participantName: a.participantId?.name || "Unknown",
        userName: a.userId?.name || "Guest",
      }))
    };

    return summary;
  } catch (error) {
    console.error("Error getting session activity summary:", error);
    return null;
  }
};

module.exports = {
  trackJoinActivity,
  trackLeaveActivity,
  trackKickActivity,
  trackReconnectActivity,
  getSessionActivitySummary,
};