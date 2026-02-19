import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useParticipantSession } from "../../context/ParticipantSessionContext.jsx";
import { STORAGE_KEY } from "../../context/ParticipantSessionContext.jsx";
import SessionHeader from "../../components/Participant/SessionHeader.jsx";
import WelcomeContent from "../../components/Participant/WelcomeContent.jsx";
import ParticipantQnA from "../../components/Participant/ParticipantQnA.jsx";
import ParticipantLiveQuiz from "../../components/Participant/ParticipantLiveQuiz.jsx";
import SessionFeedbackModal from "../../components/Participant/SessionFeedbackModal.jsx";
// AskQuestionModal was replaced by an inline ask panel inside ParticipantQnA
import api from "../../utils/api.js";
import toast from "../../utils/toastUtils.js";
import { useSubmitDebounce } from "../../hooks/useDebounce.js";

const ParticipantSession = () => {
  const navigate = useNavigate();
  // * Context
  const {
    sessionData,
    setSessionData,

    clearSession,
    socketRef,
    socketReady,

    activePoll,
    setActivePoll,

    setPollSubmitting,
    setPollSubmitted,

    setPollId,

    // Quiz context
    activeQuiz,
    setActiveQuiz,
    setQuizAnswers,
    setQuizSubmitted,
    setQuizResult,
    
    // HOST_CONTROLLED quiz context
    setHcCurrentQuestion,
    setHcQuestionIndex,
    setHcTimeRemaining,
    setHcQuestionDuration,
    setHcAnswerSubmitted,
    setHcLeaderboard,
    setHcFinalResults,
    setHcShowResults,
  } = useParticipantSession();

  // Ref to track current activeQuiz for socket handlers (avoids stale closure)
  const activeQuizRef = useRef(activeQuiz);
  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);

  const [questions, setQuestions] = useState([]);
  const [askOpen, setAskOpen] = useState(false);
  const [qnaOpen, setQnaOpen] = useState(false);

  // Session feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // * Fetch session data and participant count
  const fetchSessionData = async (sessionCode) => {
    try {
      const res = await api.get(`/api/sessions/code/${sessionCode}`);
      if (res.data && res.data.participantCount) {
        setParticipantCount(res.data.participantCount);
        console.log(
          "[Participant] Session data fetched, participant count:",
          res.data.participantCount,
        );
      }
    } catch (err) {
      console.error("Failed to fetch session data:", err);
    }
  };

  // * Handle Leave Session Handler
  const handleLeaveSession = async () => {
    if (!sessionData) return;
    try {
      // * Update DB to remove participant from session
      await api.post(`/api/sessions/code/${sessionData.joinCode}/leave`, {
        participantId: sessionData.participantId,
      });
      // * After DB update, emit socket event
      const socket = socketRef.current;
      if (socket) {
        // * Emit leave-session event
        socket.emit("leave-session", {
          code: sessionData.joinCode,
          participantId: sessionData.participantId,
        });
      }
      // * Clear context and redirect
      clearSession();
      navigate("/participant/home");
    } catch (err) {
      alert("Failed to leave session. Please try again.");
    }
  };

  // * If no session in context (e.g., on fast route change), attempt hydrate from storage before redirect
  useEffect(() => {
    if (!sessionData) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSessionData(parsed);
          return;
        }
      } catch {}
      navigate("/participant/home");
    }
  }, [sessionData, setSessionData, navigate]);

  // * Fetch session data and participant count on initial load
  useEffect(() => {
    if (sessionData?.joinCode) {
      fetchSessionData(sessionData.joinCode);
    }
  }, [sessionData?.joinCode]);

  // * Register socket listeners using context-managed socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!sessionData || !socket) return;

    // * ------------------- Handlers -------------------

    // * Poll Handlers
    const onVoteUpdateReceived = ({ pollId, counts }) => {
      setPollSubmitting(false);
      setPollSubmitted(false);

      setActivePoll((prev) => {
        if (!prev || prev._id !== pollId) return prev;
        const newOptions = prev.options.map((opt, idx) => ({
          ...opt,
          votes: counts[idx] || 0,
        }));
        const updated = { ...prev, options: newOptions };
        sessionStorage.setItem("activePoll", JSON.stringify(updated));
        return updated;
      });
    };

    const onNewPollReceived = (poll) => {
      setActivePoll(poll);
      setPollId(poll._id);
      sessionStorage.setItem("activePoll", JSON.stringify(poll));
    };

    const onPollClosed = ({ pollId }) => {
      setActivePoll((prev) => {
        if (prev && prev._id === pollId) {
          sessionStorage.removeItem("activePoll");
          return null;
        }
        return prev;
      });
    };

    // * Session Handlers
    const onBroadcast = (data) => {
      setBroadcastMsg(
        `${data.message}${data.from ? ` (from ${data.from})` : ""}`,
      );
    };

    const onParticipantsUpdate = (data) => {
      if (data.code === sessionData.joinCode) {
        // Fetch reliable count from API instead of using socket data
        fetchSessionData(sessionData.joinCode);
      }
    };

    const onSessionEnded = (payload) => {
      // Show feedback modal instead of alert
      setShowFeedbackModal(true);
    };

    // * Q&A Handlers
    const onCreated = (payload) => {
      const q = payload.question;

      const normalized = {
        authorId: q.authorId,
        id: q._id,
        text: q.text,
        upvotes: q.upvotes || 0,
        answered: !!q.isAnswered,
        isAnonymous: !!q.isAnonymous,
        studentName: q.studentName || q.authorName || "",
        timestamp: q.createdAt,
      };
      setQuestions((prev) => [normalized, ...prev]);
    };

    const onUpdated = (payload) => {
      const q = payload.question;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q._id
            ? { ...item, text: q.text || item.text, answered: !!q.isAnswered }
            : item,
        ),
      );
    };

    const onDeleted = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) => prev.filter((item) => item.id !== questionId));
    };

    const onUpvoted = (payload) => {
      const { questionId, delta } = payload;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId
            ? { ...item, upvotes: (item.upvotes || 0) + delta }
            : item,
        ),
      );
    };

    const onAnswered = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId ? { ...item, answered: true } : item,
        ),
      );
    };

    // * Quiz Handlers
    const onQuizLaunched = (quizData) => {
      console.log("📝 Quiz launched:", quizData);
      // Normalize quiz data - backend sends quizId, but we store it as _id for consistency
      const normalizedQuiz = {
        ...quizData,
        _id: quizData.quizId || quizData._id,
      };
      setActiveQuiz(normalizedQuiz);
      
      // Reset ONE_SHOT quiz state
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      
      // Reset HOST_CONTROLLED quiz state
      setHcCurrentQuestion(null);
      setHcQuestionIndex(-1);
      setHcTimeRemaining(0);
      setHcQuestionDuration(0);
      setHcAnswerSubmitted(false);
      setHcLeaderboard([]);
      setHcFinalResults(null);
      setHcShowResults(false);
      
      sessionStorage.setItem("activeQuiz", JSON.stringify(normalizedQuiz));
    };

    const onQuizClosed = ({ quizId }) => {
      setActiveQuiz((prev) => {
        if (prev && (prev.quizId === quizId || prev._id === quizId)) {
          sessionStorage.removeItem("activeQuiz");
          return null; // Close the quiz view
        }
        return prev;
      });
      // Also clear quiz state
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      // Clear HC state
      setHcCurrentQuestion(null);
      setHcQuestionIndex(-1);
      setHcAnswerSubmitted(false);
      setHcShowResults(false);
    };

    // HOST_CONTROLLED Quiz Handlers
    const onHCQuestion = (data) => {
      console.log("📝 HC Question received:", data);
      // Use ref to get current activeQuiz (avoids stale closure)
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && data.quizId !== currentQuiz._id) {
        console.log("🚫 Ignoring HC question from different quiz:", data.quizId, "current:", currentQuiz._id);
        return;
      }
      const { question, questionIndex, totalQuestions, durationSeconds, startedAt } = data;
      
      setHcCurrentQuestion(question);
      setHcQuestionIndex(questionIndex);
      setHcQuestionDuration(durationSeconds);
      setHcAnswerSubmitted(false);
      setHcShowResults(false);
      
      // Calculate remaining time
      const elapsed = Date.now() - new Date(startedAt).getTime();
      const remaining = Math.max(0, durationSeconds - Math.floor(elapsed / 1000));
      setHcTimeRemaining(remaining);
    };

    const onHCAnswerAck = (data) => {
      console.log("✅ HC Answer acknowledged:", data);
      // Use ref to get current activeQuiz (avoids stale closure)
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && data.quizId !== currentQuiz._id) {
        console.log("🚫 Ignoring HC answer ack from different quiz:", data.quizId, "current:", currentQuiz._id);
        return;
      }
      setHcAnswerSubmitted(true);
    };

    const onHCResults = (data) => {
      console.log("📊 HC Question results:", data);
      // Use ref to get current activeQuiz (avoids stale closure)
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && data.quizId !== currentQuiz._id) {
        console.log("🚫 Ignoring HC results from different quiz:", data.quizId, "current:", currentQuiz._id);
        return;
      }
      const { leaderboard } = data;
      setHcLeaderboard(leaderboard || []);
      setHcShowResults(true);
    };

    const onHCFinal = (data) => {
      console.log("🏆 HC Final results:", data);
      // Use ref to get current activeQuiz (avoids stale closure)
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && data.quizId !== currentQuiz._id) {
        console.log("🚫 Ignoring HC final results from different quiz:", data.quizId, "current:", currentQuiz._id);
        return;
      }
      setHcFinalResults(data);
      setHcShowResults(true);
    };

    const onHCError = ({ error }) => {
      console.error("❌ HC Error:", error);
    };

    // * ------------------- Socket Listeners -------------------
    try {
      socket.on("polls:new-poll", onNewPollReceived);
      socket.on("poll:update", onVoteUpdateReceived);
      socket.on("poll:closed", onPollClosed);

      socket.on("broadcast:message", onBroadcast);
      socket.on("participants:update", onParticipantsUpdate);
      socket.on("session:ended", onSessionEnded);

      socket.on("qna:question:created", onCreated);
      socket.on("qna:question:updated", onUpdated);
      socket.on("qna:question:deleted", onDeleted);
      socket.on("qna:question:upvoted", onUpvoted);
      socket.on("qna:question:answered", onAnswered);

      // Quiz listeners
      socket.on("quiz:launched", onQuizLaunched);
      socket.on("quiz:closed", onQuizClosed);
      
      // HOST_CONTROLLED quiz listeners
      socket.on("quiz:hc:question", onHCQuestion);
      socket.on("quiz:hc:answer:ack", onHCAnswerAck);
      socket.on("quiz:hc:results", onHCResults);
      socket.on("quiz:hc:final", onHCFinal);
      socket.on("quiz:hc:error", onHCError);
    } catch (err) {
      console.error("Failed to register socket listeners", err);
    }

    return () => {
      try {
        socket.off("polls:new-poll", onNewPollReceived);
        socket.off("poll:update", onVoteUpdateReceived);
        socket.off("poll:closed", onPollClosed);

        socket.off("broadcast:message", onBroadcast);
        socket.off("participants:update", onParticipantsUpdate);
        socket.off("session:ended", onSessionEnded);

        socket.off("qna:question:created", onCreated);
        socket.off("qna:question:updated", onUpdated);
        socket.off("qna:question:deleted", onDeleted);
        socket.off("qna:question:upvoted", onUpvoted);
        socket.off("qna:question:answered", onAnswered);

        // Quiz listeners
        socket.off("quiz:launched", onQuizLaunched);
        socket.off("quiz:closed", onQuizClosed);
        
        // HOST_CONTROLLED quiz listeners
        socket.off("quiz:hc:question", onHCQuestion);
        socket.off("quiz:hc:answer:ack", onHCAnswerAck);
        socket.off("quiz:hc:results", onHCResults);
        socket.off("quiz:hc:final", onHCFinal);
        socket.off("quiz:hc:error", onHCError);
      } catch (err) {
        /* ignore */
      }
    };
    //! Only re-register when socket instance or sessionData changes. We intentionally omit clearSession and navigate from deps to avoid identity changes triggering cleanup.
    //! eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData, socketReady]);

  // * Fetch initial questions for participant
  useEffect(() => {
    if (!sessionData?.session?._id) return;
    const fetchQuestions = async () => {
      try {
        const res = await api.get(
          `/api/questions/session/${sessionData.session._id}`,
        );
        const normalized = (res.data.questions || []).map((q) => ({
          authorId: q.authorId,
          id: q._id,
          text: q.text,
          upvotes: q.upvotes || 0,
          answered: !!q.isAnswered,
          isAnonymous: !!q.isAnonymous,
          studentName: q.studentName || q.authorName || "",
          timestamp: q.createdAt,
        }));
        setQuestions(normalized);
      } catch (err) {
        console.error("Failed to load questions for participant", err);
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [sessionData]);

  // Post a new question
  const postQuestionHandler = async ({ text, isAnonymous }) => {
    if (!sessionData?.session?._id) return;

    try {
      // Send to server; rely on socket event to update UI (no local optimistic insert)
      await api.post(`/api/questions`, {
        sessionId: sessionData.session._id,
        text,
        isAnonymous,
      });
    } catch (err) {
      console.error("Failed to post question", err);
      alert("Failed to post question");
    }
  };

  const { execute: postQuestion, isLoading: isPostingQuestion } =
    useSubmitDebounce(
      postQuestionHandler,
      500, // ? 500ms debounce delay
    );

  const upvoteQuestion = async (questionId) => {
    try {
      await api.post(`/api/questions/${questionId}/upvote`);
      // rely on socket event
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  };

  // Handle session feedback submission
  const handleFeedbackSubmit = async ({ rating, description }) => {
    setFeedbackSubmitting(true);
    try {
      await api.post(`/api/feedback/${sessionData.session._id}/sessionFeedback`, {
        rating,
        description
      });
      
      console.log("Feedback submitted:", { rating, description });
      
      toast.success("Thank you for your feedback!");
      clearSession();
      navigate("/participant/home");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error("Failed to submit feedback. You will be redirected.");
      clearSession();
      navigate("/participant/home");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // * Persist activePoll in sessionStorage to survive page reloads
  useEffect(() => {
    if (activePoll) {
      sessionStorage.setItem("activePoll", JSON.stringify(activePoll));
    } else {
      sessionStorage.removeItem("activePoll");
    }
  }, [activePoll]);

  // * Persist activeQuiz in sessionStorage to survive page reloads
  useEffect(() => {
    if (activeQuiz) {
      sessionStorage.setItem("activeQuiz", JSON.stringify(activeQuiz));
    } else {
      sessionStorage.removeItem("activeQuiz");
    }
  }, [activeQuiz]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionHeader sessionData={sessionData} onLeave={handleLeaveSession} />

      <div className="pt-6 sm:pt-8 lg:pt-12">
        {/* Quiz takes priority when active */}
        {activeQuiz ? (
          <ParticipantLiveQuiz />
        ) : !qnaOpen ? (
          <WelcomeContent
            sessionData={sessionData}
            broadcastMsg={broadcastMsg}
            questionsCount={questions.length}
            onShowQNA={() => setQnaOpen(true)}
            participantCount={participantCount}
          />
        ) : (
          <ParticipantQnA
            questions={questions}
            onUpvote={upvoteQuestion}
            askOpen={askOpen}
            setAskOpen={setAskOpen}
            onBack={() => setQnaOpen(false)}
            onSubmit={postQuestion}
            isSubmitting={isPostingQuestion()}
          />
        )}
      </div>

      {/* Session Feedback Modal */}
      <SessionFeedbackModal
        isOpen={showFeedbackModal}
        sessionTitle={sessionData?.session?.title}
        roomName={sessionData?.session?.roomId?.name || sessionData?.roomName}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={feedbackSubmitting}
      />
    </div>
  );
};

export default ParticipantSession;
