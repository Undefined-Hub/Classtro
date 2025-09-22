import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useParticipantSession } from "../../context/ParticipantSessionContext.jsx";
import { STORAGE_KEY } from "../../context/ParticipantSessionContext.jsx";
import SessionHeader from '../../components/Participant/SessionHeader.jsx';
import WelcomeContent from '../../components/Participant/WelcomeContent.jsx';
import ParticipantQnA from '../../components/Participant/ParticipantQnA.jsx';
import AskQuestionModal from '../../components/Participant/AskQuestionModal.jsx';
import axios from 'axios';

const SOCKET_URL =
  (import.meta.env?.VITE_BACKEND_BASE_URL || "http://localhost:5000") +
  "/sessions";

const ParticipantSession = () => {
  const navigate = useNavigate();
  const { sessionData, setSessionData, clearSession } = useParticipantSession();

  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [askOpen, setAskOpen] = useState(false);
  const [qnaOpen, setQnaOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [activePoll, setActivePoll] = useState(() => {
    try {
      const raw = sessionStorage.getItem("activePoll");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [pollId, setPollId] = useState(null);
  const socketRef = useRef(null);
  // Submit poll answer for a specific option
  const handlePollSubmit = (optionId) => {
    if (!activePoll || !optionId || !socketRef.current) return;
    setPollSubmitting(true);
    // Find the index of the selected option
    const optionIndex = activePoll.options.findIndex(opt => opt._id === optionId);
    if (optionIndex === -1) return;
    console.log("Submitting vote for option index:", {
        code: sessionData?.joinCode,
        pollId: activePoll._id,
        participantId: sessionData?.participantId,
        optionIndex,
      });
    socketRef.current.emit(
      "poll:vote",
      {
        code: sessionData?.joinCode,
        pollId: activePoll._id,
        participantId: sessionData?.participantId,
        optionIndex,
      },
      () => {
        setSelectedOption(optionId);
        setPollSubmitting(false);
        setPollSubmitted(true);
      }
    );
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
      } catch { }
      navigate("/participant/home");
    }
  }, [sessionData, setSessionData, navigate]);

  // Initialize socket on mount and join session room
  useEffect(() => {
    if (!sessionData || socketRef.current) return;

    const token = localStorage.getItem("accessToken");
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Participant] connected:", socket.id);
      socket.emit("join-session", {
        code: sessionData.joinCode,
        participantId: sessionData.participantId,
        role: "student",
      });

      const onNewPollReceived = (poll)=>{
        console.log("[Participant] New poll received:", poll);
        setActivePoll(poll);
        setPollId(poll._id);
        sessionStorage.setItem("activePoll", JSON.stringify(poll));
      }

      socket.on("polls:new-poll", onNewPollReceived);
      socket.on("poll:update", ({ pollId, counts }) => {
        // Update the activePoll's vote counts
        setPollSubmitting(false);
        setPollSubmitted(false);
        setActivePoll(prev => {
          if (!prev || prev._id !== pollId) return prev;
          const newOptions = prev.options.map((opt, idx) => ({ ...opt, votes: counts[idx] || 0 }));
          const updated = { ...prev, options: newOptions };
          sessionStorage.setItem("activePoll", JSON.stringify(updated));
          return updated;
        });
      });

      socket.on("poll:closed", ({ pollId }) => {
        console.log("Poll closed:", pollId);
        setActivePoll(prev => {
          console.log("Current activePoll:", prev._id," : ",pollId);
          if (prev && prev._id === pollId) {
            sessionStorage.removeItem("activePoll");
            return null;
          }
          return prev;
        });
      });
    });

    const onBroadcast = (data) => {
      setBroadcastMsg(`${data.message}${data.from ? ` (from ${data.from})` : ""}`);
    };

    const onParticipantsUpdate = (data) => {
      if (data.code === sessionData.joinCode) setParticipantCount(data.count);
    };

    const onSessionEnded = () => {
      alert("Session has ended by the host. You will be redirected.");
      clearSession();
      navigate("/participant/home");
    };

    socket.on("broadcast:message", onBroadcast);
    socket.on("participants:update", onParticipantsUpdate);
    socket.on("session:ended", onSessionEnded);

    // Q&A events
    const onCreated = (payload) => {
      const q = payload.question;
      const normalized = {
        id: q._id,
        text: q.text,
        upvotes: q.upvotes || 0,
        answered: !!q.isAnswered,
        isAnonymous: !!q.isAnonymous,
        studentName: q.studentName || (q.authorName || ''),
        timestamp: q.createdAt,
      };
      setQuestions((prev) => [normalized, ...prev]);
    };

    const onUpdated = (payload) => {
      const q = payload.question;
      setQuestions((prev) => prev.map((item) => item.id === q._id ? { ...item, text: q.text || item.text, answered: !!q.isAnswered } : item));
    };

    const onDeleted = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) => prev.filter((item) => item.id !== questionId));
    };

    const onUpvoted = (payload) => {
      const { questionId, delta } = payload;
      setQuestions((prev) => prev.map((item) => item.id === questionId ? { ...item, upvotes: (item.upvotes || 0) + delta } : item));
    };

    const onAnswered = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) => prev.map((item) => item.id === questionId ? { ...item, answered: true } : item));
    };

    socket.on('qna:question:created', onCreated);
    socket.on('qna:question:updated', onUpdated);
    socket.on('qna:question:deleted', onDeleted);
    socket.on('qna:question:upvoted', onUpvoted);
    socket.on('qna:question:answered', onAnswered);

    return () => {
      try { socket.emit("leave-session", { code: sessionData.joinCode, participantId: sessionData.participantId }); } catch { }
      socket.off("broadcast:message", onBroadcast);
      socket.off("participants:update", onParticipantsUpdate);
      socket.off("session:ended", onSessionEnded);
      socket.off('qna:question:created', onCreated);
      socket.off('qna:question:updated', onUpdated);
      socket.off('qna:question:deleted', onDeleted);
      socket.off('qna:question:upvoted', onUpvoted);
      socket.off('qna:question:answered', onAnswered);
      socket.disconnect();
      socketRef.current = null;
      clearSession();
    };
  }, [sessionData, clearSession, navigate]);

  // Fetch initial questions for participant
  useEffect(() => {
    if (!sessionData?.session?._id) return;
    const fetchQuestions = async () => {
      try {
        const baseURL = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${baseURL}/api/questions/session/${sessionData.session._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });
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
      const baseURL = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      await axios.post(`${baseURL}/api/questions`, { sessionId: sessionData.session._id, text, isAnonymous }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      // Rely on socket event to update UI
    } catch (err) {
      console.error('Failed to post question', err);
      alert('Failed to post question');
    }
  };

  const upvoteQuestion = async (questionId) => {
    try {
      const baseURL = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      await axios.post(`${baseURL}/api/questions/${questionId}/upvote`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      // rely on socket event
    } catch (err) {
      console.error('Failed to upvote', err);
    }
  };

  const handleLeaveSession = async () => {
    if (!sessionData) return;
    try {
      const baseURL = import.meta.env?.VITE_BACKEND_BASE_URL || "http://localhost:5000";
      const token = localStorage.getItem("accessToken");
      await fetch(`${baseURL}/api/sessions/code/${sessionData.joinCode}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ participantId: sessionData.participantId }),
      });
      const socket = socketRef.current;
      if (socket) socket.emit("leave-session", { code: sessionData.joinCode, participantId: sessionData.participantId });
      clearSession();
      navigate("/participant/home");
    } catch (err) {
      alert("Failed to leave session. Please try again.");
    }
  };

  useEffect(() => {
    if (activePoll) {
      sessionStorage.setItem("activePoll", JSON.stringify(activePoll));
    } else {
      sessionStorage.removeItem("activePoll");
    }
  }, [activePoll]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionHeader sessionData={sessionData} participantCount={participantCount} onLeave={handleLeaveSession} />

      <div className="pt-6 sm:pt-8 lg:pt-12">
        {!qnaOpen ? (
          <WelcomeContent sessionData={sessionData} participantCount={participantCount} broadcastMsg={broadcastMsg} questionsCount={questions.length} onShowQNA={() => setQnaOpen(true)} />
        ) : (
          <ParticipantQnA questions={questions} onUpvote={upvoteQuestion} askOpen={askOpen} setAskOpen={setAskOpen} onBack={() => setQnaOpen(false)} />
        )}
      </div>

      <AskQuestionModal open={askOpen} onClose={() => setAskOpen(false)} onSubmit={postQuestion} />
    </div>
  );
};

export default ParticipantSession;