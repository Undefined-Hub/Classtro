// services/analyticsBuilder.js
const Participant = require("../models/Participant");
const SessionActivity = require("../models/SessionActivity");
const Poll = require("../models/Polls");
const Question = require("../models/Question");
const SessionFeedback = require("../models/SessionFeedback");
const Session = require("../models/Session");
const Room = require("../models/Room");
const { generateAIResponse } = require("./ai/core");

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
      result.sections.ai = await generateAiInsights({
        sessionId,
        session,
        builtSections: result.sections,
      });
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
    const aiInsights = await generateAiInsights({
      sessionId,
      session,
      builtSections: {
        participants: participantStats,
        timeline,
        polls: await generatePollStats(sessionId),
        qna: await generateQnaStats(sessionId),
        attendance: await generateAttendance(sessionId),
        feedback: await generateFeedbackStats(sessionId),
      },
    });

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
      ai: aiInsights,
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

const computeBaseWordCloud = (comments = [], limit = 20) => {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "was", "were", "are", "very",
    "have", "from", "your", "about", "just", "really", "more", "would", "could",
    "should", "class", "session", "teacher", "lecture", "today", "still", "also",
    "because", "into", "actually", "something", "things", "thing", "happened", "happen",
  ]);

  const themeRules = [
    {
      label: "teaching quality",
      patterns: [/teach(er|ing)?/i, /must teach/i, /didn'?t teach/i, /not taught/i],
    },
    {
      label: "engagement",
      patterns: [/interest/i, /engag/i, /boring/i, /attention/i],
    },
    {
      label: "clarity",
      patterns: [/clarity/i, /clear/i, /unclear/i, /confus/i, /understand/i],
    },
    {
      label: "pace",
      patterns: [/pace/i, /too fast/i, /too slow/i, /fast/i, /slow/i],
    },
    {
      label: "examples",
      patterns: [/example/i, /demo/i, /practical/i, /real world/i, /application/i],
    },
    {
      label: "doubt support",
      patterns: [/doubt/i, /question/i, /query/i, /answer/i, /respond/i],
    },
    {
      label: "interaction",
      patterns: [/interactive/i, /participation/i, /participate/i, /poll/i],
    },
  ];

  const positiveWords = new Set([
    "great", "good", "nice", "excellent", "amazing", "helpful", "clear", "interesting",
  ]);
  const negativeWords = new Set([
    "not", "dont", "don't", "didnt", "didn't", "nothing", "boring", "unclear", "confusing",
    "bad", "worse", "poor", "hard", "difficult",
  ]);

  const frequencies = new Map();
  const increment = (term, amount = 1) => {
    if (!term || term.length < 3) return;
    frequencies.set(term, (frequencies.get(term) || 0) + amount);
  };

  comments.forEach((rawComment) => {
    const comment = String(rawComment || "").trim();
    if (!comment) return;

    const normalized = comment.toLowerCase().replace(/\s+/g, " ");
    const tokens = normalized
      .replace(/[^a-z'\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.replace(/^'+|'+$/g, ""))
      .filter(Boolean);

    const hasPositiveWord = tokens.some((token) => positiveWords.has(token));
    const hasNegativeWord = tokens.some((token) => negativeWords.has(token));
    const sarcasmCue =
      /(yeah right|as if|huh|lol|lmao|sure)/i.test(normalized) ||
      (hasPositiveWord && hasNegativeWord);

    const matchedThemeLabels = new Set();
    themeRules.forEach((rule) => {
      if (rule.patterns.some((pattern) => pattern.test(normalized))) {
        matchedThemeLabels.add(rule.label);
      }
    });

    matchedThemeLabels.forEach((label) => increment(label, 1));

    // Interpret contradictory positive language as dissatisfaction signal.
    if (sarcasmCue && hasPositiveWord) {
      increment("frustration", 1);
    }

    if (!matchedThemeLabels.size) {
      tokens
        .filter((token) => token.length >= 4 && !stopWords.has(token))
        .slice(0, 3)
        .forEach((token) => increment(token, 1));
    }
  });

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

const enrichWordCloudWithAI = async (comments = [], rawCloud = []) => {
  if (!rawCloud.length || !comments.length) return rawCloud;

  try {
    const sampledComments = comments
      .filter(Boolean)
      .slice(0, 30)
      .map((comment) => String(comment).slice(0, 220));

    const prompt =
      `You are extracting a teacher-facing word cloud from student feedback comments.\n` +
      `Goal: produce short terms that reflect true intent, including sarcasm and negation context.\n\n` +
      `Example of sarcasm to treat as negative intent:\n` +
      `- "Huh great session nothing actually happened."\n` +
      `- "I don't find session very interesting. teacher must actually teach something."\n` +
      `In such cases, do NOT output misleading positive words like "great" as a dominant term.\n\n` +
      `Comments:\n${JSON.stringify(sampledComments, null, 2)}\n\n` +
      `Deterministic base cloud:\n${JSON.stringify(rawCloud, null, 2)}\n\n` +
      `Output STRICT JSON only with schema:\n` +
      `{ "words": [{ "word": "teaching quality", "count": 4 }] }\n` +
      `Rules:\n` +
      `- 8 to 15 words max.\n` +
      `- word must be a short canonical term (1 to 3 words).\n` +
      `- count must be integer >= 1.\n` +
      `- Keep terms clean and human-readable.\n` +
      `- Prefer context-aware themes over raw token fragments.`;

    const aiResponse = await generateAIResponse(prompt, {
      model: "gemini-2.5-flash-lite",
      maxTokens: 420,
      temperature: 0.2,
    });

    const text = String(aiResponse || "").trim();
    if (!text || text.startsWith("⚠️")) return rawCloud;

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fenced ? fenced[1] : text;

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!Array.isArray(parsed?.words)) return rawCloud;

    const words = parsed.words
      .map((item) => ({
        word: String(item.word || "")
          .toLowerCase()
          .replace(/[^a-z\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
        count: Number(item.count) || 0,
      }))
      .filter((item) => item.word && item.count > 0)
      .slice(0, 15);

    return words.length ? words : rawCloud;
  } catch (error) {
    console.warn(
      "Word cloud AI enrichment failed, using base cloud:",
      error?.message || error,
    );
    return rawCloud;
  }
};

const generateWordCloudFromComments = async (comments = []) => {
  const baseCloud = computeBaseWordCloud(comments, 20);
  if (!baseCloud.length) return [];

  const enriched = await enrichWordCloudWithAI(comments, baseCloud);
  const maxCount = Math.max(...enriched.map((entry) => entry.count), 1);

  return enriched.map((entry, index) => {
    const weight = entry.count / maxCount;
    const fontSize = Math.round(12 + weight * 18);
    const rotationClass =
      index % 4 === 0 ? "-rotate-2" : index % 5 === 0 ? "rotate-2" : "rotate-0";

    return {
      word: entry.word,
      count: entry.count,
      fontSize,
      rotationClass,
      toneClass:
        index % 3 === 0
          ? "bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
          : index % 3 === 1
            ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
  });
};

const formatFeedbackForFrontend = async (feedbacks) => {
  if (feedbacks.length === 0) {
    return {
      averageRating: 0,
      comments: [],
      sentiment: "neutral",
      wordCloud: [],
    };
  }

  const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
  const averageRating = totalRating / feedbacks.length;
  
  const comments = feedbacks
    .filter(feedback => feedback.description && feedback.description.trim())
    .map(feedback => feedback.description);
  const wordCloud = await generateWordCloudFromComments(comments);

  // Simple sentiment analysis based on rating
  let sentiment = "neutral";
  if (averageRating >= 4) sentiment = "positive";
  else if (averageRating <= 2) sentiment = "negative";

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    comments,
    sentiment,
    wordCloud,
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
        wordCloud: [],
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

    const comments = feedbacks
      .filter(f => f.description && f.description.trim())
      .map(f => f.description);
    const wordCloud = await generateWordCloudFromComments(comments);
    
    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      sentiment,
      wordCloud,
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
      wordCloud: [],
    };
  }
};

const buildAiFacts = ({ session, builtSections }) => {
  const participants = builtSections.participants || {};
  const timeline = builtSections.timeline || [];
  const polls = builtSections.polls || [];
  const qna = builtSections.qna || {};
  const attendance = builtSections.attendance || [];
  const feedback = builtSections.feedback || {};

  const durationMinutes = Math.max(
    1,
    Math.round(
      ((new Date(session.endAt || new Date()) - new Date(session.startAt)) /
        1000 /
        60) || 1,
    ),
  );

  const avgPollResponses = polls.length
    ? Math.round(
        polls.reduce((sum, poll) => sum + (poll.totalResponses || 0), 0) /
          polls.length,
      )
    : 0;

  const bestPoll = polls.reduce(
    (best, poll) =>
      (poll.totalResponses || 0) > (best.totalResponses || 0) ? poll : best,
    { question: "", totalResponses: 0 },
  );

  const lowestActivePoint = timeline.reduce(
    (lowest, point) =>
      lowest.activeParticipants === null ||
      (point.activeParticipants || 0) < lowest.activeParticipants
        ? point
        : lowest,
    { minute: 0, activeParticipants: null },
  );

  const attendanceFullCount = attendance.filter(
    (item) => item.attendanceStatus === "full",
  ).length;

  const attendanceRate = attendance.length
    ? Math.round((attendanceFullCount / attendance.length) * 100)
    : 0;

  const topQuestion = (qna.questions || []).reduce(
    (max, current) =>
      (current.upvotes || 0) > (max.upvotes || 0) ? current : max,
    { text: "", upvotes: 0 },
  );

  const peakTimelinePoint = timeline.reduce(
    (max, point) =>
      (point.activeParticipants || 0) > (max.activeParticipants || 0)
        ? point
        : max,
    { minute: 0, activeParticipants: 0 },
  );

  return {
    session: {
      title: session.title || "Untitled session",
      durationMinutes,
      startAt: session.startAt,
      endAt: session.endAt || null,
    },
    participants: {
      total: participants.totalParticipants || 0,
      peakConcurrent: participants.peakConcurrentUsers || 0,
      avgConcurrent: participants.averageConcurrentUsers || 0,
      avgSessionDurationMinutes: participants.averageSessionDuration || 0,
      engagementRate: participants.engagementRate || 0,
      attendanceRate,
    },
    qna: {
      totalQuestions: qna.totalQuestions || 0,
      answeredQuestions: qna.answeredQuestions || 0,
      answerRate: qna.answerRate || 0,
      avgUpvotes: qna.averageUpvotes || 0,
      topQuestion: {
        text: String(topQuestion.text || "").slice(0, 120),
        upvotes: topQuestion.upvotes || 0,
      },
    },
    polls: {
      totalPolls: polls.length,
      avgResponsesPerPoll: avgPollResponses,
      bestPollQuestion: String(bestPoll.question || "").slice(0, 120),
      bestPollResponses: bestPoll.totalResponses || 0,
    },
    feedback: {
      totalFeedbacks: feedback.totalFeedbacks || 0,
      averageRating: feedback.averageRating || 0,
      sentiment: feedback.sentiment || "neutral",
    },
    interactionPatterns: {
      timelinePoints: timeline.length,
      peakMinute: peakTimelinePoint.minute || 0,
      peakParticipantsAtMinute: peakTimelinePoint.activeParticipants || 0,
      lowMinute: lowestActivePoint.minute || 0,
      lowParticipantsAtMinute:
        lowestActivePoint.activeParticipants === null
          ? 0
          : lowestActivePoint.activeParticipants,
    },
  };
};

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, value));

const computeSessionScore = (facts) => {
  const participantCount = facts.participants.total || 0;
  const qnaCount = facts.qna.totalQuestions || 0;
  const pollCount = facts.polls.totalPolls || 0;
  const feedbackCount = facts.feedback.totalFeedbacks || 0;

  const components = [
    {
      key: "engagement",
      weight: 0.32,
      available: participantCount > 0,
      score: clampNumber(Number(facts.participants.engagementRate || 0), 0, 100),
    },
    {
      key: "attendance",
      weight: 0.18,
      available: participantCount > 0,
      score: clampNumber(Number(facts.participants.attendanceRate || 0), 0, 100),
    },
    {
      key: "qna",
      weight: 0.2,
      available: qnaCount >= 2,
      score: clampNumber(Number(facts.qna.answerRate || 0), 0, 100),
    },
    {
      key: "feedback",
      weight: 0.2,
      available: feedbackCount >= 3,
      score: clampNumber(Number(facts.feedback.averageRating || 0) * 20, 0, 100),
    },
    {
      key: "polls",
      weight: 0.1,
      available: pollCount > 0,
      score: clampNumber(
        pollCount * 18 + Math.min(40, Number(facts.polls.avgResponsesPerPoll || 0) * 2),
        0,
        100,
      ),
    },
  ];

  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  const availableComponents = components.filter((component) => component.available);
  const availableWeight = availableComponents.reduce(
    (sum, component) => sum + component.weight,
    0,
  );
  const availableCount = availableComponents.length;
  const coverageRatio = totalWeight > 0 ? availableWeight / totalWeight : 0;

  if (!availableCount || availableWeight <= 0) {
    return {
      overallScore: null,
      scoreBreakdown: {
        overall: null,
        engagement: null,
        participation: null,
        clarity: null,
      },
      scoreMeta: {
        showScore: false,
        isReliable: false,
        reason: "insufficient-signals",
        message: "Not enough activity data to compute a reliable session score.",
        availableSignals: 0,
        totalSignals: components.length,
        coveragePercent: 0,
      },
    };
  }

  const weightedMean =
    availableComponents.reduce(
      (sum, component) => sum + component.score * component.weight,
      0,
    ) / availableWeight;

  const coveragePenalty = 0.5 + coverageRatio * 0.5;
  const maxCap = coverageRatio < 0.45 ? 72 : coverageRatio < 0.65 ? 84 : 100;

  const adjustedOverall = clampNumber(
    Math.round(weightedMean * coveragePenalty),
    1,
    maxCap,
  );

  const reliabilityThresholdMet = coverageRatio >= 0.6 && availableCount >= 3;

  return {
    overallScore: reliabilityThresholdMet ? adjustedOverall : null,
    scoreBreakdown: {
      overall: reliabilityThresholdMet ? adjustedOverall : null,
      engagement: participantCount > 0 ? clampNumber(Math.round(facts.participants.engagementRate || 0), 0, 100) : null,
      participation: participantCount > 0 ? clampNumber(Math.round((facts.participants.attendanceRate || 0) * 0.7 + (facts.participants.peakConcurrent || 0) * 0.3), 0, 100) : null,
      clarity: feedbackCount > 0 ? clampNumber(Math.round((facts.feedback.averageRating || 0) * 20), 0, 100) : null,
    },
    scoreMeta: {
      showScore: reliabilityThresholdMet,
      isReliable: reliabilityThresholdMet,
      reason: reliabilityThresholdMet ? "ok" : "low-coverage",
      message: reliabilityThresholdMet
        ? "Session score is based on sufficient coverage across engagement signals."
        : "Session score is hidden because this session has limited quiz/poll/feedback coverage.",
      availableSignals: availableCount,
      totalSignals: components.length,
      coveragePercent: Math.round(coverageRatio * 100),
    },
  };
};

const getAiInsightsFallback = (facts, reason = "AI unavailable") => {
  const answered = facts.qna.answeredQuestions;
  const totalQuestions = facts.qna.totalQuestions;
  const answerRate = facts.qna.answerRate;
  const hasMeaningfulSignals =
    (facts.participants.total || 0) > 0 ||
    (facts.qna.totalQuestions || 0) > 0 ||
    (facts.polls.totalPolls || 0) > 0 ||
    (facts.feedback.totalFeedbacks || 0) > 0;
  const { overallScore, scoreBreakdown, scoreMeta } = computeSessionScore(facts);
  const effectiveOverallScore = Number.isFinite(overallScore) ? overallScore : 0;

  return {
    available: true,
    source: "fallback",
    generatedAt: new Date().toISOString(),
    model: "deterministic-fallback",
    reason,
    overallScore,
    scoreMeta,
    executiveSummary: `This session showed ${facts.participants.total > 0 ? "active" : "limited"} participation with peak attendance of ${facts.participants.peakConcurrent}${scoreMeta.showScore ? ` and a session score of ${effectiveOverallScore}/100.` : "."}`,
    overview: `The ${facts.session.durationMinutes}-minute session on "${facts.session.title}" kept ${facts.participants.total} participants engaged, reaching a peak of ${facts.participants.peakConcurrent} concurrent attendees.`,
    engagementAnalysis: `Q&A response rate is ${answerRate}% (${answered}/${totalQuestions}). Average participant session duration is ${facts.participants.avgSessionDurationMinutes} minutes, with attendance completion at ${facts.participants.attendanceRate}%.`,
    interactionPatterns: `The session used ${facts.polls.totalPolls} polls with an average of ${facts.polls.avgResponsesPerPoll} responses per poll. Peak live participation reached ${facts.interactionPatterns.peakParticipantsAtMinute} around minute ${facts.interactionPatterns.peakMinute}, while activity dipped near minute ${facts.interactionPatterns.lowMinute}.`,
    strengths: [
      facts.feedback.averageRating >= 4
        ? "Feedback sentiment is positive, which suggests the session structure was generally well received."
        : "The session generated enough activity to produce actionable improvement signals.",
      facts.polls.totalPolls >= 2
        ? "Poll usage created touchpoints that helped re-engage participants during the session."
        : "The session maintained at least one interactive mechanism for participant response.",
      facts.participants.attendanceRate >= 70
        ? "Attendance retention was strong enough to indicate the content stayed relevant for many participants."
        : "A meaningful subset of learners stayed engaged long enough to provide behavior data."
    ],
    risks: [
      answerRate < 70
        ? "A sizable portion of questions remained unanswered, which can create the impression that concerns were left unresolved."
        : "Q&A responsiveness is solid, so the main risk is sustaining that momentum across longer sessions.",
      facts.participants.peakConcurrent < facts.participants.total
        ? "The live peak was below total attendance, which can indicate uneven participation timing or drop-off at certain points."
        : "No major attendance collapse was visible, but peak activity still needs reinforcement through structured interaction.",
      facts.feedback.averageRating < 4
        ? "Feedback is not yet strong enough to assume the current pace and format are ideal."
        : "High satisfaction is a strength, but it can hide weak spots if the session remains mostly presenter-driven."
    ],
    recommendations: [
      answerRate < 70
        ? "Reserve a dedicated Q&A checkpoint before the final segment so unanswered questions are not deferred silently."
        : "Keep the current Q&A rhythm, but call out especially good questions to model deeper participation.",
      facts.polls.totalPolls < 3
        ? "Add one early pulse-check poll and one late reflection poll to create clearer engagement anchors."
        : "Use poll results to steer the next topic instead of treating them as isolated interaction moments.",
      facts.participants.attendanceRate < 75
        ? "Break long explanations into shorter blocks and insert a recap prompt after each block to reduce silent drop-off."
        : "Maintain the current pacing, but add one higher-cognitive-demand activity to challenge the strongest learners.",
      facts.feedback.averageRating < 4
        ? "Review the low-rated feedback themes and adjust pacing, examples, or clarity in the next delivery."
        : "Build on the well-received structure by repeating the strongest interaction pattern earlier in the next session.",
      "Send a short post-session follow-up that answers the top unanswered question and summarizes the main action items.",
    ],
    priorityActions: [
      {
        label: "Address unanswered questions",
        priority: answerRate < 70 ? "high" : "medium",
        why: `${totalQuestions - answered} questions were not answered during the session.`,
      },
      {
        label: "Increase mid-session interaction",
        priority: facts.polls.totalPolls < 3 ? "high" : "medium",
        why: `${facts.polls.totalPolls} polls were used, which may not be enough to sustain participation throughout the session.`,
      },
      {
        label: "Tighten pacing around drop-off points",
        priority: facts.interactionPatterns.lowParticipantsAtMinute > 0 ? "medium" : "low",
        why: `Participation dipped around minute ${facts.interactionPatterns.lowMinute}, suggesting a good spot to insert a recap or poll.`,
      },
    ],
    scoreBreakdown: {
      overall: scoreBreakdown.overall,
      engagement: scoreBreakdown.engagement,
      participation: scoreBreakdown.participation,
      clarity: scoreBreakdown.clarity,
    },
    metrics: facts,
  };
};

const parseAiInsightsJson = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI returned an empty response");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response is not valid JSON");
    return JSON.parse(match[0]);
  }
};

const generateAiInsights = async ({ sessionId, session, builtSections }) => {
  try {
    const safeSession =
      session || (await Session.findById(sessionId).lean()) || { title: "Session" };

    const facts = buildAiFacts({
      session: safeSession,
      builtSections,
    });

    const prompt = `You are an analytics assistant for teaching sessions.\n` +
      `Generate concise, action-focused coaching insights for a host from structured session metrics.\n` +
      `Return ONLY JSON with this exact schema:\n` +
      `{\n` +
      `  "executiveSummary": string,\n` +
      `  "overview": string,\n` +
      `  "engagementAnalysis": string,\n` +
      `  "interactionPatterns": string,\n` +
      `  "strengths": string[],\n` +
      `  "risks": string[],\n` +
      `  "priorityActions": [{"label": string, "priority": "high|medium|low", "why": string}],\n` +
      `  "recommendations": string[],\n` +
      `  "scoreBreakdown": {"overall": number, "engagement": number, "participation": number, "clarity": number}\n` +
      `}\n` +
      `Rules:\n` +
      `- Keep each text field to 1-2 short sentences (max 35 words each).\n` +
      `- strengths: exactly 2 or 3 items.\n` +
      `- risks: exactly 2 or 3 items.\n` +
      `- priorityActions: exactly 2 or 3 items.\n` +
      `- recommendations: exactly 3 or 4 items.\n` +
      `- Avoid generic filler and avoid repeating the same metric in multiple fields.\n` +
      `- If a section has no meaningful signal, return an empty array for that section.\n` +
      `- Do not include markdown. JSON only.\n\n` +
      `Session metrics:\n${JSON.stringify(facts, null, 2)}`;

    const raw = await generateAIResponse(prompt, {
      maxTokens: 520,
      temperature: 0.25,
    });

    const parsed = parseAiInsightsJson(raw);
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter(Boolean).map((r) => String(r).trim()).slice(0, 6)
      : [];

    if (
      !parsed ||
      !parsed.overview ||
      !parsed.engagementAnalysis ||
      !parsed.interactionPatterns ||
      recommendations.length < 3
    ) {
      throw new Error("AI response did not match expected insights schema");
    }

    const { overallScore, scoreBreakdown, scoreMeta } = computeSessionScore(facts);

    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.filter(Boolean).map((item) => String(item).trim()).slice(0, 4)
      : [];
    const risks = Array.isArray(parsed.risks)
      ? parsed.risks.filter(Boolean).map((item) => String(item).trim()).slice(0, 4)
      : [];
    const priorityActions = Array.isArray(parsed.priorityActions)
      ? parsed.priorityActions
          .filter(Boolean)
          .map((item) => ({
            label: String(item.label || item.title || "Action").trim(),
            priority: ["high", "medium", "low"].includes(String(item.priority).toLowerCase())
              ? String(item.priority).toLowerCase()
              : "medium",
            why: String(item.why || item.reason || "").trim(),
          }))
          .slice(0, 4)
      : [];

    return {
      available: true,
      source: "ai",
      generatedAt: new Date().toISOString(),
      model: "gemini-2.5-flash-lite",
      overallScore,
      scoreMeta,
      executiveSummary: String(parsed.executiveSummary || parsed.overview).trim(),
      overview: String(parsed.overview).trim(),
      engagementAnalysis: String(parsed.engagementAnalysis).trim(),
      interactionPatterns: String(parsed.interactionPatterns).trim(),
      recommendations,
      strengths: strengths.length ? strengths : getAiInsightsFallback(facts).strengths,
      risks: risks.length ? risks : getAiInsightsFallback(facts).risks,
      priorityActions: priorityActions.length
        ? priorityActions
        : getAiInsightsFallback(facts).priorityActions,
      scoreBreakdown: scoreBreakdown || parsed.scoreBreakdown || getAiInsightsFallback(facts).scoreBreakdown,
      metrics: facts,
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);

    const fallbackFacts = buildAiFacts({
      session: session || { title: "Session", startAt: new Date(), endAt: new Date() },
      builtSections: builtSections || {},
    });

    return getAiInsightsFallback(
      fallbackFacts,
      error?.message || "AI generation failed",
    );
  }
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
      ai: sections.ai || null,
      feedback: sections.feedback ? {
        averageRating: sections.feedback.averageRating || 0,
        comments: sections.feedback.feedbacks?.map(f => f.description).filter(Boolean) || [],
        sentiment: sections.feedback.sentiment || "neutral",
        wordCloud: sections.feedback.wordCloud || [],
      } : {
        averageRating: 0,
        comments: [],
        sentiment: "neutral",
        wordCloud: [],
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