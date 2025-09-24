import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import ParticipantLivePoll from "../../components/Participant/ParticipantLivePoll.jsx";
import { useParticipantSession } from "../../context/ParticipantSessionContext.jsx";
import { STORAGE_KEY } from "../../context/ParticipantSessionContext.jsx";
import SessionHeader from "../../components/Participant/SessionHeader.jsx";
import WelcomeContent from "../../components/Participant/WelcomeContent.jsx";
import ParticipantQnA from "../../components/Participant/ParticipantQnA.jsx";
import AskQuestionModal from "../../components/Participant/AskQuestionModal.jsx";
import api from "../../utils/api.js";
import axios from "axios";
const SOCKET_URL =
  (import.meta.env?.VITE_BACKEND_BASE_URL || "http://localhost:3000") +
  "/sessions";

const ParticipantSession = () => {
  const navigate = useNavigate();
  // * Context
  const {
    sessionData,
    setSessionData,

    clearSession,
    socketRef,

    activePoll,
    setActivePoll,

    setSelectedOption,
    setPollSubmitting,
    setPollSubmitted,

    setPollId,

    selectedOption,
    pollSubmitting,
    pollSubmitted,
  } = useParticipantSession();

  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);

  const [questions, setQuestions] = useState([]);
  const [askOpen, setAskOpen] = useState(false);
  const [qnaOpen, setQnaOpen] = useState(false);

  // * Handle Vote Submission
  const handlePollSubmit = (optionId) => {
    // * Guard clauses
    if (!activePoll || !optionId || !socketRef.current) return;
    // * set submitting state
    setPollSubmitting(true);
    // * Find option index
    const optionIndex = activePoll.options.findIndex(
      (opt) => opt._id === optionId
    );
    if (optionIndex === -1) return;

    // * Debug log
    console.log("Submitting vote for option index:", {
      code: sessionData?.joinCode,
      pollId: activePoll._id,
      participantId: sessionData?.participantId,
      optionIndex,
    });

    // * Emit poll:vote event
    socketRef.current.emit(
      "poll:vote",
      {
        code: sessionData?.joinCode,
        pollId: activePoll._id,
        participantId: sessionData?.participantId,
        optionIndex,
      },

      // * Callback on acknowledgment
      () => {
        setSelectedOption(optionId);
        setPollSubmitting(false);
        setPollSubmitted(true);
      }
    );
  };

  // * Handle Leave Session Handler
  const handleLeaveSession = async () => {
    if (!sessionData) return;
    try {
      console.log("Attempting to leave session:", sessionData.joinCode);
      // * Update DB to remove participant from session
      await api.post(`/api/sessions/code/${sessionData.joinCode}/leave`, {
        participantId: sessionData.participantId,
      });
      console.log("Left session in DB");
      // * After DB update, emit socket event
      const socket = socketRef.current;
      if (socket) {
        console.log("Emitting leave-session via socket");
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

  // If no session in context (e.g., on fast route change), attempt hydrate from storage before redirect
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

  // Initialize socket on mount and join session room
  // Initialize socket on mount and join session room
  useEffect(() => {
    if (!sessionData || socketRef.current) return;

    const token = localStorage.getItem("accessToken");
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    socketRef.current = socket;

    // ------------------- Handlers -------------------

    // Poll Handlers
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
      console.log("[Participant] New poll received:", poll);
      setActivePoll(poll);
      setPollId(poll._id);
      sessionStorage.setItem("activePoll", JSON.stringify(poll));
    };

    const onPollClosed = ({ pollId }) => {
      console.log("Poll closed:", pollId);
      setActivePoll((prev) => {
        if (prev && prev._id === pollId) {
          sessionStorage.removeItem("activePoll");
          return null;
        }
        return prev;
      });
    };

    // Session Handlers
    const onBroadcast = (data) => {
      setBroadcastMsg(
        `${data.message}${data.from ? ` (from ${data.from})` : ""}`
      );
      console.log("[Participant] broadcast:message", data);
    };

    const onRoomMembers = (members) => {
      console.log("[Participant] room:members", members);
    };

    const onParticipantsUpdate = (data) => {
      console.log("[Participant] participants:update", data);
      if (data.code === sessionData.joinCode) {
        console.log("Setting the Participant Count : ",data)
        setParticipantCount(data.count);
      }
    };

    const onSessionEnded = (payload) => {
      console.log("[Participant] session:ended", payload);
      alert("Session has ended by the host. You will be redirected.");
      clearSession();
      navigate("/participant/home");
    };

    // Q&A Handlers
    const onCreated = (payload) => {
      const q = payload.question;
      const normalized = {
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
            : item
        )
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
            : item
        )
      );
    };

    const onAnswered = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId ? { ...item, answered: true } : item
        )
      );
    };

    // ------------------- Socket Listeners -------------------

    socket.on("connect", () => {
      console.log("[Participant] connected:", socket.id);
      socket.emit("join-session", {
        code: sessionData.joinCode,
        participantId: sessionData.participantId,
        role: "student",
      });
    });

    // Poll listeners
    socket.on("polls:new-poll", onNewPollReceived);
    socket.on("poll:update", onVoteUpdateReceived);
    socket.on("poll:closed", onPollClosed);

    // Session listeners
    socket.on("broadcast:message", onBroadcast);
    socket.on("room:members", onRoomMembers);
    socket.on("participants:update", onParticipantsUpdate);
    socket.on("session:ended", onSessionEnded);

    // Q&A listeners
    socket.on("qna:question:created", onCreated);
    socket.on("qna:question:updated", onUpdated);
    socket.on("qna:question:deleted", onDeleted);
    socket.on("qna:question:upvoted", onUpvoted);
    socket.on("qna:question:answered", onAnswered);

    // ------------------- Cleanup -------------------
    return () => {
      if (socketRef.current) {
        try {
          socket.emit("leave-session", {
            code: sessionData.joinCode,
            participantId: sessionData.participantId,
          });
        } catch {}

        socket.off("polls:new-poll", onNewPollReceived);
        socket.off("poll:update", onVoteUpdateReceived);
        socket.off("poll:closed", onPollClosed);
        socket.off("broadcast:message", onBroadcast);
        socket.off("room:members", onRoomMembers);
        socket.off("participants:update", onParticipantsUpdate);
        socket.off("session:ended", onSessionEnded);

        socket.off("qna:question:created", onCreated);
        socket.off("qna:question:updated", onUpdated);
        socket.off("qna:question:deleted", onDeleted);
        socket.off("qna:question:upvoted", onUpvoted);
        socket.off("qna:question:answered", onAnswered);

        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionData, clearSession, navigate]);

  // Fetch initial questions for participant
  useEffect(() => {
    if (!sessionData?.session?._id) return;
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/api/questions/session/${sessionData.session._id}`);
        const normalized = (res.data.questions || []).map((q) => ({
          id: q._id,
          text: q.text,
          upvotes: q.upvotes || 0,
          answered: !!q.isAnswered,
          isAnonymous: !!q.isAnonymous,
          studentName: q.studentName || (q.authorName || ''),
          timestamp: q.createdAt,
        }));
        setQuestions(normalized);
      } catch (err) {
        console.error('Failed to load questions for participant', err);
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [sessionData]);

  // Post a new question
  const postQuestion = async ({ text, isAnonymous }) => {
    if (!sessionData?.session?._id) return;
    try {
   
      await api.post(
        `/api/questions`,
        { sessionId: sessionData.session._id, text, isAnonymous }        
      );
      // Rely on socket event to update UI
    } catch (err) {
      console.error("Failed to post question", err);
      alert("Failed to post question");
    }
  };

  const upvoteQuestion = async (questionId) => {
    try {
      await api.post(`/api/questions/${questionId}/upvote`);
      // rely on socket event
    } catch (err) {
      console.error('Failed to upvote', err);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionHeader
        sessionData={sessionData}
        participantCount={participantCount}
        onLeave={handleLeaveSession}
      />

      <div className="pt-6 sm:pt-8 lg:pt-12">
        {!qnaOpen ? (
          <WelcomeContent
            sessionData={sessionData}
            broadcastMsg={broadcastMsg}
            questionsCount={questions.length}
            onShowQNA={() => setQnaOpen(true)}
            handlePollSubmit={handlePollSubmit}
             participantCount={participantCount}
          />
        ) : (
          <ParticipantQnA
            questions={questions}
            onUpvote={upvoteQuestion}
            askOpen={askOpen}
            setAskOpen={setAskOpen}
            onBack={() => setQnaOpen(false)}
          />
        )}
      </div>

      <AskQuestionModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onSubmit={postQuestion}
      />
    </div>
  );
};

export default ParticipantSession;
