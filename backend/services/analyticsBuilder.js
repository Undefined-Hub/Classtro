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
      includedSections: { ...sections },
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
      includedSections: {
        participants: true,
        timeline: true,
        polls: true,
        qna: true,
        attendance: true,
        feedback: true,
        ai: true,
      },
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
    author: question.isAnonymous ? "Anonymous" : (question.authorId?.name || "Anonymous"),
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
    .filter(feedback => feedback.description && feedback.description.trim())
    .map(feedback => feedback.description);

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
  
  // Prefer activity-based tracking if available
  if (activities.length > 0) {
    activities.forEach(activity => {
      const change = activity.activityType === 'join' || activity.activityType === 'reconnect' ? 1 : -1;
      events.push({
        time: activity.timestamp,
        change,
        type: activity.activityType,
        participantId: activity.participantId
      });
    });
  } else {
    // Fallback: Create join/leave events from participant data
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
  }

  // Sort events by time using getTime() for proper comparison
  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  let currentCount = 0;
  let peakCount = 0;
  let totalTime = 0;
  let weightedSum = 0;
  let lastTime = new Date(session.startAt).getTime();

  events.forEach(event => {
    const eventTime = new Date(event.time).getTime();
    const timeDiff = Math.max(0, eventTime - lastTime);
    weightedSum += currentCount * timeDiff;
    totalTime += timeDiff;
    
    currentCount = Math.max(0, currentCount + event.change);
    peakCount = Math.max(peakCount, currentCount);
    lastTime = eventTime;
  });

  // Handle remaining time until session end
  const sessionEnd = new Date(session.endAt || new Date()).getTime();
  const finalTimeDiff = Math.max(0, sessionEnd - lastTime);
  weightedSum += currentCount * finalTimeDiff;
  totalTime += finalTimeDiff;

  // Ensure peak count is at least 1 if there are participants
  if (participants.length > 0 && peakCount === 0) {
    peakCount = 1;
  }

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
    
    // Generate timeline with 5-minute intervals
    const timeline = [];
    const intervalMinutes = 5; // 5-minute intervals
    const maxPoints = 100;
    
    let currentTime = new Date(sessionStart);
    let pointCount = 0;
    
    // Always add start point
    const startActiveCount = calculateActiveParticipantsAtTime(
      currentTime, 
      participants, 
      activities
    );
    
    timeline.push({
      timestamp: new Date(currentTime),
      activeParticipants: startActiveCount,
      minute: 0,
    });
    pointCount++;
    
    // Generate intermediate points up to max limit
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    
    while (currentTime < sessionEnd && pointCount < maxPoints - 1) {
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
      pointCount++;
      
      // Move to next interval
      currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    }
    
    // Always add end point if not already added and not at limit
    if (pointCount < maxPoints && (timeline.length === 0 || Math.abs(timeline[timeline.length - 1].timestamp - sessionEnd) > 1000)) {
      const endActiveCount = calculateActiveParticipantsAtTime(
        sessionEnd, 
        participants, 
        activities
      );
      
      timeline.push({
        timestamp: new Date(sessionEnd),
        activeParticipants: endActiveCount,
        minute: Math.floor((sessionEnd - sessionStart) / (1000 * 60)),
      });
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
  try {
    const polls = await Poll.find({ sessionId }).lean();
    
    return polls.map(poll => {
      const totalResponses = poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
      
      return {
        pollId: poll._id,
        question: poll.question,
        options: poll.options?.map(option => ({
          text: option.text,
          votes: option.votes || 0,
          percentage: totalResponses > 0 ? Math.round((option.votes || 0) / totalResponses * 100) : 0,
        })) || [],
        totalResponses,
        createdAt: poll.createdAt,
      };
    });
  } catch (error) {
    console.error("Error generating poll stats:", error);
    return [];
  }
};

const generateQnaStats = async (sessionId) => {
  try {
    const questions = await Question.find({ sessionId })
      .populate("authorId", "name")
      .sort({ createdAt: -1 })
      .lean();
    
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => q.isAnswered).length;
    const totalUpvotes = questions.reduce((sum, q) => sum + (q.upvotes || 0), 0);
    const answerRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      unansweredQuestions: totalQuestions - answeredQuestions,
      answerRate,
      totalUpvotes,
      averageUpvotes: totalQuestions > 0 ? Math.round((totalUpvotes / totalQuestions) * 10) / 10 : 0,
      questions: questions.map(q => ({
        questionId: q._id,
        text: q.text,
        author: q.isAnonymous ? "Anonymous" : (q.authorId?.name || "Anonymous"),
        upvotes: q.upvotes || 0,
        answered: q.isAnswered || false,
        createdAt: q.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error generating Q&A stats:", error);
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      unansweredQuestions: 0,
      answerRate: 0,
      totalUpvotes: 0,
      averageUpvotes: 0,
      questions: [],
    };
  }
};

const generateAttendance = async (sessionId) => {
  try {
    const participants = await Participant.find({ sessionId })
      .populate("userId", "name email")
      .sort({ joinedAt: 1 })
      .lean();
    
    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return [];
    }
    
    // Calculate session duration using milliseconds for accuracy
    const sessionStart = new Date(session.startAt);
    const sessionEnd = session.endAt ? new Date(session.endAt) : new Date();
    const sessionDurationMs = sessionEnd - sessionStart;
    
    return participants.map(participant => {
      const joinTime = new Date(participant.joinedAt);
      const leaveTime = participant.leftAt ? new Date(participant.leftAt) : sessionEnd;
      
      // Calculate actual milliseconds attended (for percentage calculation)
      const durationMs = leaveTime - joinTime;
      
      // Display duration in minutes (rounded)
      const duration = Math.round(durationMs / (1000 * 60));
      
      // Determine attendance status based on ACTUAL percentage (not rounded)
      // Calculate percentage using raw milliseconds for accuracy
      console.log(`Calculating attendance for participant ${participant._id}: durationMs=${durationMs}, sessionDurationMs=${sessionDurationMs}`);
      const attendancePercentage = (durationMs / sessionDurationMs) * 100;
      
      // Fair logic:
      // Full: attended >= 75% of session OR (joined at start AND stayed to end)
      // Partial: attended < 75% of session
      const minutesAfterStart = (joinTime - sessionStart) / (1000 * 60);
      const minutesBeforeEnd = (sessionEnd - leaveTime) / (1000 * 60);
      
      const attendanceStatus = 
        (attendancePercentage >= 75) || (minutesAfterStart <= 1 && minutesBeforeEnd <= 1)
          ? "full" 
          : "partial";
      
      // Determine status: kicked, left, or active
      let status;
      if (participant.kicked) {
        status = "kicked";
      } else if (participant.leftAt) {
        status = "left";
      } else {
        status = "active";
      }
      
      return {
        participantId: participant._id,
        name: participant.userId?.name || participant.name || "Anonymous",
        email: participant.userId?.email || null,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt || null,
        duration, // in minutes
        status,
        attendanceStatus,
        attendancePercentage: Math.round(attendancePercentage), // for debugging
      };
    });
  } catch (error) {
    console.error("Error generating attendance:", error);
    return [];
  }
};

const generateFeedbackStats = async (sessionId) => {
  try {
    const feedbacks = await SessionFeedback.find({ sessionId })
      .populate("userId", "name")
      .sort({ submittedAt: -1 })
      .lean();
    
    const totalFeedbacks = feedbacks.length;
    
    if (totalFeedbacks === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentiment: "neutral",
        feedbacks: [],
      };
    }
    
    const totalRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating = totalRating / totalFeedbacks;
    
    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingDistribution[f.rating]++;
      }
    });
    
    // Simple sentiment analysis
    let sentiment = "neutral";
    if (averageRating >= 4) sentiment = "positive";
    else if (averageRating <= 2) sentiment = "negative";
    
    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      sentiment,
      feedbacks: feedbacks.map(f => ({
        feedbackId: f._id,
        userName: f.userId?.name || "Anonymous",
        rating: f.rating,
        description: f.description || "",
        submittedAt: f.submittedAt,
      })),
    };
  } catch (error) {
    console.error("Error generating feedback stats:", error);
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentiment: "neutral",
      feedbacks: [],
    };
  }
};

const generateAiInsights = async (sessionId) => {
  // Placeholder for AI insights - premium feature
  return {
    available: false,
    message: "AI insights are a premium feature. Upgrade to unlock detailed AI-powered analytics.",
    insights: [],
    recommendations: [],
  };
};

// Helper to format stored analytics into frontend format
const formatStoredAnalytics = async (storedAnalytics) => {
  try {
    const session = await Session.findById(storedAnalytics.sessionId)
      .populate('roomId')
      .lean();
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    const sections = storedAnalytics.sections || {};
    const participantStats = sections.participants || {};
    const includedSections = {
      participants:
        storedAnalytics.includedSections?.participants ??
        (sections.participants !== null && sections.participants !== undefined),
      timeline:
        storedAnalytics.includedSections?.timeline ??
        (sections.timeline !== null && sections.timeline !== undefined),
      polls:
        storedAnalytics.includedSections?.polls ??
        (sections.polls !== null && sections.polls !== undefined),
      qna:
        storedAnalytics.includedSections?.qna ??
        (sections.qna !== null && sections.qna !== undefined),
      attendance:
        storedAnalytics.includedSections?.attendance ??
        (sections.attendance !== null && sections.attendance !== undefined),
      feedback:
        storedAnalytics.includedSections?.feedback ??
        (sections.feedback !== null && sections.feedback !== undefined),
      ai:
        storedAnalytics.includedSections?.ai ??
        (sections.ai !== null && sections.ai !== undefined),
    };
    
    // Build frontend structure from cached sections
    return {
      includedSections,
      sessionInfo: {
        title: session.title || "Session Analytics",
        roomName: session.roomId?.name || "Unknown Room",
        startAt: session.startAt,
        endAt: session.endAt,
        totalParticipants: participantStats.totalParticipants || 0,
        peakParticipants: participantStats.peakConcurrentUsers || 0,
        pollsConducted: sections.polls?.length || 0,
        questionsAsked: sections.qna?.totalQuestions || 0,
      },
      participants: await formatStoredParticipants(storedAnalytics.sessionId, sections.attendance),
      participantsTimeline: formatStoredTimeline(sections.timeline),
      polls: sections.polls || [],
      questions: sections.qna?.questions || [],
      feedback: sections.feedback ? {
        averageRating: sections.feedback.averageRating || 0,
        comments: sections.feedback.feedbacks?.map(f => f.description).filter(Boolean) || [],
        sentiment: sections.feedback.sentiment || "neutral",
      } : {
        averageRating: 0,
        comments: [],
        sentiment: "neutral",
      },
    };
  } catch (error) {
    console.error("Error formatting stored analytics:", error);
    throw new Error(`Failed to format stored analytics: ${error.message}`);
  }
};

// Helper to format stored participants for frontend
const formatStoredParticipants = async (sessionId, attendance) => {
  // Get session info for calculating attendance status
  const session = await Session.findById(sessionId).lean();
  
  if (!attendance || attendance.length === 0) {
    // Fallback to fetching participants
    const participants = await Participant.find({ sessionId })
      .populate("userId", "name")
      .lean();
    
    return participants.map(p => ({
      id: p._id,
      name: p.userId?.name || p.name || "Anonymous",
      joinAt: p.joinedAt,
      leaveAt: p.leftAt,
      duration: p.leftAt ? 
        Math.round((new Date(p.leftAt) - new Date(p.joinedAt)) / (1000 * 60)) : 0,
      attendanceStatus: "partial", // fallback when no attendance data
    }));
  }
  
  return attendance.map(a => {
    let attendanceStatus = a.attendanceStatus;
    
    // Calculate attendanceStatus on-the-fly for old cached data (backward compatibility)
    if (!attendanceStatus && session) {
      const sessionStart = new Date(session.startAt);
      const sessionEnd = session.endAt ? new Date(session.endAt) : new Date();
      const sessionDurationMs = sessionEnd - sessionStart;
      
      const joinTime = new Date(a.joinedAt);
      const leaveTime = a.leftAt ? new Date(a.leftAt) : sessionEnd;
      const durationMs = leaveTime - joinTime;
      
      const attendancePercentage = (durationMs / sessionDurationMs) * 100;
      const minutesAfterStart = (joinTime - sessionStart) / (1000 * 60);
      const minutesBeforeEnd = (sessionEnd - leaveTime) / (1000 * 60);
      
      attendanceStatus = 
        (attendancePercentage >= 75) || (minutesAfterStart <= 1 && minutesBeforeEnd <= 1)
          ? "full" 
          : "partial";
    }
    
    return {
      id: a.participantId,
      name: a.name,
      joinAt: a.joinedAt,
      leaveAt: a.leftAt,
      duration: a.duration,
      attendanceStatus: attendanceStatus || "partial",
      status: a.status, // kicked, left, or active
    };
  });
};

// Helper to format stored timeline for frontend
const formatStoredTimeline = (timeline) => {
  if (!timeline || timeline.length === 0) {
    return [];
  }
  
  return timeline.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    activeCount: point.activeParticipants,
  }));
};

module.exports = {
  buildAnalytics,
  buildFrontendAnalytics,
  formatStoredAnalytics,
  generateParticipantStats,
  generateTimeline,
  generatePollStats,
  generateQnaStats,
  generateAttendance,
  generateFeedbackStats,
  generateAiInsights,
};