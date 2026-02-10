// services/analyticsBuilder.js
const Participant = require("../models/Participant");
const SessionActivity = require("../models/SessionActivity");
const Poll = require("../models/Polls");
const Question = require("../models/Question");
const SessionFeedback = require("../models/SessionFeedback");
const Session = require("../models/Session");
const Room = require("../models/Room");

// Main function to build analytics
const buildAnalytics = async (sessionId, sections) => {
  try {
    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let result = {
      sessionId,
      roomId: session.roomId,
      generatedAt: new Date(),
      sections: {},
    };

    // Build analytics sections based on requested sections
    if (sections.participants) {
      result.sections.participants = await generateParticipantStats(sessionId);
    }

    if (sections.timeline) {
      result.sections.timeline = await generateTimeline(sessionId);
    }

    if (sections.polls) {
      result.sections.polls = await generatePollStats(sessionId);
    }

    if (sections.qna) {
      result.sections.qna = await generateQnaStats(sessionId);
    }

    if (sections.attendance) {
      result.sections.attendance = await generateAttendance(sessionId);
    }

    if (sections.feedback) {
      result.sections.feedback = await generateFeedbackStats(sessionId);
    }

    if (sections.ai) {
      result.sections.ai = await generateAiInsights(sessionId);
    }

    return result;
  } catch (error) {
    console.error("Analytics builder error:", error);
    throw new Error(`Failed to build analytics: ${error.message}`);
  }
};

// Frontend-compatible analytics structure
const buildFrontendAnalytics = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId).populate('roomId');
    if (!session) {
      throw new Error("Session not found");
    }

    // Get all required data
    const participants = await Participant.find({ sessionId })
      .populate("userId", "name email")
      .lean();

    const activities = await SessionActivity.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    const polls = await Poll.find({ sessionId }).lean();
    const questions = await Question.find({ sessionId })
      .populate("authorId", "name")
      .lean();
    const feedbacks = await SessionFeedback.find({ sessionId }).lean();

    // Calculate participant stats
    const participantStats = await generateParticipantStats(sessionId);
    const timeline = await generateTimeline(sessionId);
    
    // Build frontend-compatible structure
    return {
      sessionInfo: {
        title: session.title || "Session Analytics",
        roomName: session.roomId?.name || "Unknown Room",
        startAt: session.startAt,
        endAt: session.endAt,
        totalParticipants: participantStats.totalParticipants,
        peakParticipants: participantStats.peakConcurrentUsers,
        pollsConducted: polls.length,
        questionsAsked: questions.length,
      },
      participants: formatParticipantsForFrontend(participants, activities, session),
      participantsTimeline: formatTimelineForFrontend(timeline),
      polls: formatPollsForFrontend(polls),
      questions: formatQuestionsForFrontend(questions),
      feedback: await formatFeedbackForFrontend(feedbacks),
    };
  } catch (error) {
    console.error("Frontend analytics builder error:", error);
    throw new Error(`Failed to build frontend analytics: ${error.message}`);
  }
};

// Helper functions to format data for frontend
const formatParticipantsForFrontend = (participants, activities, session) => {
  const participantDurations = calculateParticipantDurations(participants, activities, session);
  
  return participants.map((participant, index) => {
    const durationData = participantDurations.find(p => 
      p.participantId.toString() === participant._id.toString()
    ) || { totalDuration: 0 };
    
    return {
      id: participant._id,
      name: participant.userId?.name || participant.name || "Anonymous",
      joinAt: participant.joinedAt,
      leaveAt: participant.leftAt,
      duration: Math.round(durationData.totalDuration / (1000 * 60)), // minutes
    };
  });
};

const formatTimelineForFrontend = (timeline) => {
  return timeline.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    activeCount: point.activeParticipants,
  }));
};

const formatPollsForFrontend = (polls) => {
  return polls.map(poll => {
    const totalResponses = poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
    
    return {
      id: poll._id,
      question: poll.question,
      options: poll.options?.map(option => ({
        text: option.text,
        votes: option.votes || 0,
      })) || [],
      totalResponses,
    };
  });
};

const formatQuestionsForFrontend = (questions) => {
  return questions.map(question => ({
    id: question._id,
    askedBy: question.isAnonymous ? "Anonymous" : (question.authorId?.name || "Anonymous"),
    text: question.text,
    upvotes: question.upvotes || 0,
    answered: question.isAnswered || false,
    createdAt: question.createdAt,
  }));
};

const formatFeedbackForFrontend = async (feedbacks) => {
  if (feedbacks.length === 0) {
    return {
      averageRating: 0,
      comments: [],
      sentiment: "neutral",
    };
  }

  const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
  const averageRating = totalRating / feedbacks.length;
  
  const comments = feedbacks
    .filter(feedback => feedback.comment)
    .map(feedback => feedback.comment);

  // Simple sentiment analysis based on rating
  let sentiment = "neutral";
  if (averageRating >= 4) sentiment = "positive";
  else if (averageRating <= 2) sentiment = "negative";

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    comments,
    sentiment,
  };
};
const generateParticipantStats = async (sessionId) => {
  try {
    // Get session info for duration calculations
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get all participants for this session
    const participants = await Participant.find({ sessionId })
      .populate("userId", "name email")
      .lean();

    const totalParticipants = participants.length;
    
    // Get session activities for duration tracking
    const activities = await SessionActivity.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    // Calculate peak concurrent users using join/leave events
    const concurrentStats = calculatePeakConcurrency(participants, activities, session);
    
    // Calculate individual participant durations
    const participantDurations = calculateParticipantDurations(participants, activities, session);
    
    // Calculate engagement metrics
    const engagementStats = calculateEngagementMetrics(participantDurations, session);

    return {
      totalParticipants,
      peakConcurrentUsers: concurrentStats.peak,
      averageConcurrentUsers: concurrentStats.average,
      averageSessionDuration: engagementStats.averageDuration,
      totalSessionTime: engagementStats.totalTime,
      engagementRate: engagementStats.engagementRate,
      participantBreakdown: {
        activeParticipants: participants.filter(p => p.isActive).length,
        leftParticipants: participants.filter(p => p.leftAt).length,
        kickedParticipants: participants.filter(p => p.kicked).length,
      },
      durationDistribution: engagementStats.durationDistribution,
      topParticipantsByDuration: participantDurations
        .sort((a, b) => b.totalDuration - a.totalDuration)
        .slice(0, 10),
    };

  } catch (error) {
    console.error("Error generating participant stats:", error);
    return {
      totalParticipants: 0,
      peakConcurrentUsers: 0,
      averageConcurrentUsers: 0,
      averageSessionDuration: 0,
      totalSessionTime: 0,
      engagementRate: 0,
      participantBreakdown: {
        activeParticipants: 0,
        leftParticipants: 0,
        kickedParticipants: 0,
      },
      durationDistribution: {},
      topParticipantsByDuration: [],
    };
  }
};

// Helper function to calculate peak concurrency
const calculatePeakConcurrency = (participants, activities, session) => {
  const events = [];
  
  // Create join/leave events from participant data (fallback)
  participants.forEach(participant => {
    events.push({
      time: participant.joinedAt,
      change: 1,
      type: 'join',
      participantId: participant._id
    });
    
    if (participant.leftAt) {
      events.push({
        time: participant.leftAt,
        change: -1,
        type: 'leave',
        participantId: participant._id
      });
    }
  });

  // Add activity events (more accurate if available)
  activities.forEach(activity => {
    const change = activity.activityType === 'join' || activity.activityType === 'reconnect' ? 1 : -1;
    events.push({
      time: activity.timestamp,
      change,
      type: activity.activityType,
      participantId: activity.participantId
    });
  });

  // Sort events by time
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  let currentCount = 0;
  let peakCount = 0;
  let totalTime = 0;
  let weightedSum = 0;
  let lastTime = session.startAt;

  events.forEach(event => {
    const timeDiff = new Date(event.time) - new Date(lastTime);
    weightedSum += currentCount * timeDiff;
    totalTime += timeDiff;
    
    currentCount += event.change;
    peakCount = Math.max(peakCount, currentCount);
    lastTime = event.time;
  });

  // Handle remaining time until session end
  const sessionEnd = session.endAt || new Date();
  const finalTimeDiff = new Date(sessionEnd) - new Date(lastTime);
  weightedSum += currentCount * finalTimeDiff;
  totalTime += finalTimeDiff;

  const averageConcurrent = totalTime > 0 ? weightedSum / totalTime : 0;

  return {
    peak: peakCount,
    average: Math.round(averageConcurrent * 100) / 100
  };
};

// Helper function to calculate participant durations
const calculateParticipantDurations = (participants, activities, session) => {
  const participantMap = new Map();

  participants.forEach(participant => {
    participantMap.set(participant._id.toString(), {
      participantId: participant._id,
      name: participant.name,
      userId: participant.userId,
      totalDuration: 0,
      sessions: [],
      joinCount: 0,
    });
  });

  // Process activities for more accurate duration tracking
  if (activities.length > 0) {
    const userSessions = new Map();

    activities.forEach(activity => {
      const participantId = activity.participantId.toString();
      
      if (!userSessions.has(participantId)) {
        userSessions.set(participantId, []);
      }

      const sessions = userSessions.get(participantId);
      
      if (activity.activityType === 'join' || activity.activityType === 'reconnect') {
        sessions.push({ joinTime: activity.timestamp, leaveTime: null });
      } else if (activity.activityType === 'leave' || activity.activityType === 'kicked') {
        const lastSession = sessions[sessions.length - 1];
        if (lastSession && !lastSession.leaveTime) {
          lastSession.leaveTime = activity.timestamp;
        }
      }
    });

    // Calculate durations
    userSessions.forEach((sessions, participantId) => {
      const participant = participantMap.get(participantId);
      if (!participant) return;

      let totalDuration = 0;
      sessions.forEach(session => {
        const leaveTime = session.leaveTime || (session.endAt || new Date());
        const duration = new Date(leaveTime) - new Date(session.joinTime);
        totalDuration += Math.max(0, duration);
      });

      participant.totalDuration = totalDuration;
      participant.sessions = sessions;
      participant.joinCount = sessions.length;
    });
  } else {
    // Fallback to participant join/leave times
    participants.forEach(participant => {
      const participantData = participantMap.get(participant._id.toString());
      if (!participantData) return;

      const leaveTime = participant.leftAt || session.endAt || new Date();
      const duration = new Date(leaveTime) - new Date(participant.joinedAt);
      
      participantData.totalDuration = Math.max(0, duration);
      participantData.joinCount = 1;
    });
  }

  return Array.from(participantMap.values());
};

// Helper function to calculate engagement metrics
const calculateEngagementMetrics = (participantDurations, session) => {
  if (participantDurations.length === 0) {
    return {
      averageDuration: 0,
      totalTime: 0,
      engagementRate: 0,
      durationDistribution: {}
    };
  }

  const sessionDuration = session.endAt ? 
    new Date(session.endAt) - new Date(session.startAt) : 
    new Date() - new Date(session.startAt);

  const totalParticipantTime = participantDurations.reduce((sum, p) => sum + p.totalDuration, 0);
  const averageDuration = totalParticipantTime / participantDurations.length;
  const engagementRate = sessionDuration > 0 ? (averageDuration / sessionDuration) * 100 : 0;

  // Duration distribution (in minutes)
  const durationDistribution = {
    '0-5min': 0,
    '5-15min': 0,
    '15-30min': 0,
    '30-60min': 0,
    '60min+': 0
  };

  participantDurations.forEach(p => {
    const minutes = p.totalDuration / (1000 * 60);
    if (minutes <= 5) durationDistribution['0-5min']++;
    else if (minutes <= 15) durationDistribution['5-15min']++;
    else if (minutes <= 30) durationDistribution['15-30min']++;
    else if (minutes <= 60) durationDistribution['30-60min']++;
    else durationDistribution['60min+']++;
  });

  return {
    averageDuration: Math.round(averageDuration / 1000 / 60 * 100) / 100, // minutes
    totalTime: Math.round(totalParticipantTime / 1000 / 60), // total minutes
    engagementRate: Math.round(engagementRate * 100) / 100,
    durationDistribution
  };
};

const generateTimeline = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const participants = await Participant.find({ sessionId }).lean();
    const activities = await SessionActivity.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    const sessionStart = new Date(session.startAt);
    const sessionEnd = session.endAt ? new Date(session.endAt) : new Date();
    
    // Generate minute-by-minute timeline
    const timeline = [];
    const intervalMinutes = 15; // 5-minute intervals
    
    let currentTime = new Date(sessionStart);
    
    while (currentTime <= sessionEnd) {
      const activeCount = calculateActiveParticipantsAtTime(
        currentTime, 
        participants, 
        activities
      );
      
      timeline.push({
        timestamp: new Date(currentTime),
        activeParticipants: activeCount,
        minute: Math.floor((currentTime - sessionStart) / (1000 * 60)),
      });
      
      // Move to next minute
      currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    }

    return timeline;
    
  } catch (error) {
    console.error("Error generating timeline:", error);
    return [];
  }
};

// Helper function to calculate active participants at specific time
const calculateActiveParticipantsAtTime = (targetTime, participants, activities) => {
  let activeCount = 0;
  
  // If we have activity tracking, use it for more accurate counts
  if (activities.length > 0) {
    const participantStates = new Map();
    
    // Initialize all participants as inactive
    participants.forEach(p => {
      participantStates.set(p._id.toString(), false);
    });
    
    // Process activities up to target time
    activities.forEach(activity => {
      if (activity.timestamp <= targetTime) {
        const participantId = activity.participantId.toString();
        
        if (activity.activityType === 'join' || activity.activityType === 'reconnect') {
          participantStates.set(participantId, true);
        } else if (activity.activityType === 'leave' || activity.activityType === 'kicked') {
          participantStates.set(participantId, false);
        }
      }
    });
    
    // Count active participants
    participantStates.forEach(isActive => {
      if (isActive) activeCount++;
    });
    
  } else {
    // Fallback to participant join/leave times
    participants.forEach(participant => {
      const joinTime = new Date(participant.joinedAt);
      const leaveTime = participant.leftAt ? new Date(participant.leftAt) : new Date();
      
      if (joinTime <= targetTime && targetTime <= leaveTime) {
        activeCount++;
      }
    });
  }
  
  return activeCount;
};

const generatePollStats = async (sessionId) => {
  // TODO: Implement poll statistics
  return [];
};

const generateQnaStats = async (sessionId) => {
  // TODO: Implement Q&A statistics
  return {
    totalQuestions: 0,
    answeredQuestions: 0,
    // More stats to be implemented
  };
};

const generateAttendance = async (sessionId) => {
  // TODO: Implement attendance tracking
  return [];
};

const generateFeedbackStats = async (sessionId) => {
  // TODO: Implement feedback statistics
  return {
    totalFeedbacks: 0,
    averageRating: 0,
    // More stats to be implemented
  };
};

const generateAiInsights = async (sessionId) => {
  // TODO: Implement AI insights (optional)
  return {
    insights: [],
    recommendations: [],
  };
};

module.exports = {
  buildAnalytics,
  buildFrontendAnalytics,
  generateParticipantStats,
  generateTimeline,
  generatePollStats,
  generateQnaStats,
  generateAttendance,
  generateFeedbackStats,
  generateAiInsights,
};