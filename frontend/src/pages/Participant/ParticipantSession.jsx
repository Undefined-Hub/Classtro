import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useParticipantSession } from "../../context/ParticipantSessionContext.jsx";
import { STORAGE_KEY } from "../../context/ParticipantSessionContext.jsx";
import SessionClock from "../../components/Participant/SessionClock.jsx";
import QuestionsPanel from '../../components/Participant/QuestionsPanel.jsx';
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
  const socketRef = useRef(null);

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

  // Removed per-second clock re-render; SessionClock handles its own interval

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
    });

    const onBroadcast = (data) => {
      setBroadcastMsg(
        `${data.message}${data.from ? ` (from ${data.from})` : ""}`,
      );
      console.log("[Participant] broadcast:message", data);
    };
    const onRoomMembers = (members) => {
      console.log("[Participant] room:members", members);
    };

    const onParticipantsUpdate = (data) => {
      console.log("[Participant] participants:update", data);
      if (data.code === sessionData.joinCode) {
        setParticipantCount(data.count);
      }
    };

    const onSessionEnded = (payload) => {
      console.log("[Participant] session:ended", payload);
      alert("Session has ended by the host. You will be redirected.");
      clearSession();
      navigate("/participant/home");
    };

    socket.on("broadcast:message", onBroadcast);
    socket.on("room:members", onRoomMembers);
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
      try {
        socket.emit("leave-session", {
          code: sessionData.joinCode,
          participantId: sessionData.participantId,
        });
      } catch { }
      socket.off("broadcast:message", onBroadcast);
      socket.off("room:members", onRoomMembers);
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
      console.log('[Participant] posting question', { sessionId: sessionData.session._id, text, isAnonymous });
      await axios.post(`${baseURL}/api/questions`, {
        sessionId: sessionData.session._id,
        text,
        isAnonymous,
      }, {
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

  // Time formatting handled in SessionClock (hh:mm)

  const handleLeaveSession = async () => {
    if (!sessionData) return;
    try {
      // Call backend API to update DB
      const baseURL =
        import.meta.env?.VITE_BACKEND_BASE_URL || "http://localhost:5000";
      const token = localStorage.getItem("accessToken");
      await fetch(
        `${baseURL}/api/sessions/code/${sessionData.joinCode}/leave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ participantId: sessionData.participantId }),
        },
      );
      // After DB update, emit socket event
      const socket = socketRef.current;
      if (socket) {
        socket.emit("leave-session", {
          code: sessionData.joinCode,
          participantId: sessionData.participantId,
        });
      }
      clearSession();
      navigate("/participant/home");
    } catch (err) {
      alert("Failed to leave session. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                  Live Session
                </span>
                <SessionClock className="text-xs sm:text-sm text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32 lg:max-w-none">
                    {sessionData?.session?.title || "Session"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Code: {sessionData?.joinCode || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32 lg:max-w-none">
                    Host: {sessionData?.session?.teacherId?.name || "Unknown"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLeaveSession}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-red-300 dark:border-red-600 text-xs sm:text-sm font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Leave Session</span>
                <span className="sm:hidden">Leave</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center">
          {!qnaOpen ? (
            // Default "You're All Set" content
            <>
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 sm:mb-8">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Main Message */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                You're All Set!
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-2">
                Successfully joined the session
              </p>

              {/* Participant count badge */}
              <div className="mt-4 sm:mt-6 inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {participantCount} participant{participantCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Session info for mobile */}
              <div className="sm:hidden mt-4 px-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {sessionData?.session?.title || "Session"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Code: {sessionData?.joinCode || "N/A"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 truncate">
                    Host: {sessionData?.session?.teacherId?.name || "Unknown"}
                  </div>
                </div>
              </div>

              {/* Waiting or Broadcast Message */}
              {!broadcastMsg ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg mx-auto mt-6 sm:mt-8">
                  <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                    Waiting for Host
                  </h3>
                  <p className="text-sm sm:text-base text-blue-800 dark:text-blue-300">
                    Please keep this window open
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg mx-auto mt-6 sm:mt-8 animate-fade-in">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 dark:text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                    Announcement from Host
                  </h3>
                  <p className="text-sm sm:text-lg text-yellow-800 dark:text-yellow-200 break-words">
                    {broadcastMsg}
                  </p>
                </div>
              )}

              {/* Connection Status */}
              <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-2 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Connected to session
                </span>
              </div>

              {/* Open Q&A Button */}
              <div className="mt-6 max-w-xs sm:max-w-md mx-auto px-4 sm:px-0">
                <button
                  onClick={() => setQnaOpen(true)}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Open Q&A
                </button>
              </div>
            </>
          ) : (
            // Q&A Content - Replaces the entire central area
            <div className="max-w-xs sm:max-w-md lg:max-w-lg mx-auto px-2 sm:px-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
                {/* Q&A Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <button
                    onClick={() => setQnaOpen(false)}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 -ml-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm sm:text-base">Back</span>
                  </button>
                  <h2 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400">Q&A</h2>
                  <div className="w-12"></div>
                </div>

                {/* Questions content */}
                {questions.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center h-48 sm:h-56 lg:h-64 text-center px-4">
                    <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                      Do you have a question for the presenter?<br />
                      Be the first one to ask!
                    </p>
                    <button
                      onClick={() => setAskOpen(true)}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    >
                      Ask a question
                    </button>
                  </div>
                ) : (
                  // Questions list
                  <div className="space-y-4 sm:space-y-0">
                    <div className="mb-4 sm:mb-6">
                      <button
                        onClick={() => setAskOpen(true)}
                        className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                      >
                        Ask a question
                      </button>
                    </div>

                    {/* Questions List */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
                      {[...questions].sort((a, b) => {
                        if ((b.upvotes || 0) !== (a.upvotes || 0)) return (b.upvotes || 0) - (a.upvotes || 0);
                        return new Date(b.timestamp) - new Date(a.timestamp);
                      }).map((q, index) => (
                        <div key={q.id} className={`flex items-center space-x-3 py-3 sm:py-4 first:pt-0 last:pb-0 relative ${q.answered ? 'pr-6 sm:pr-8' : 'pr-2'}`}>
                          {/* Upvote Section */}
                          <div className="flex flex-col items-center flex-shrink-0 min-w-[2rem]">
                            <button
                              onClick={() => upvoteQuestion(q.id)}
                              className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                              {q.upvotes || 0}
                            </span>
                          </div>

                          {/* Question Content - Vertically Centered */}
                          <div className="flex-1 min-w-0 flex items-center">
                            <p className="text-gray-900 dark:text-white text-sm sm:text-base leading-relaxed text-left break-words">
                              {q.text}
                            </p>
                          </div>

                          {/* Right-edge answered indicator - Vertically Centered */}
                          {q.answered && (
                            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 h-8 sm:h-10 w-1 sm:w-1.5 rounded-full bg-green-400 dark:bg-green-500" aria-hidden="true" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ask Question Modal */}
          <AskQuestionModal open={askOpen} onClose={() => setAskOpen(false)} onSubmit={postQuestion} />
        </div>
      </div>
    </div>
  );
};

export default ParticipantSession;
