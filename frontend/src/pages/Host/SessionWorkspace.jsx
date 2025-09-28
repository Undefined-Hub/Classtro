import React, { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

// * Components imports
import SessionHeader from "../../components/Host/sessionWorkspace/SessionHeader";
import MainContent from "../../components/Host/sessionWorkspace/MainContent";
import PollManager from "../../components/Host/sessionWorkspace/PollManager";
import QAManager from "../../components/Host/sessionWorkspace/QAManager";
import ParticipantList from "../../components/Host/sessionWorkspace/ParticipantList";
import QuickActions from "../../components/Host/sessionWorkspace/QuickActions";
import { useHostSession } from "../../context/HostSessionContext.jsx";
import axios from "axios";
// * API import
import api from "../../utils/api.js";

const BACKEND_BASE_URL =
import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";

const SOCKET_URL = BACKEND_BASE_URL + "/sessions";

// Participants state will be fetched from backend

// !remove in production
// Mock questions data
const MOCK_QUESTIONS = [
  {
    id: "q1",
    text: "What is the difference between SQL and NoSQL databases?",
    studentName: "Alice Johnson",
    isAnonymous: false,
    timestamp: new Date().toISOString(),
    upvotes: 3,
    answered: false,
  },
  {
    id: "q2",
    text: "How do you implement authentication in a web app?",
    studentName: "",
    isAnonymous: true,
    timestamp: new Date().toISOString(),
    upvotes: 7,
    answered: true,
  },
];

// !remove in production
// Mock session data fallback
const MOCK_SESSION_DATA = {
  _id: "session123",
  title: "Introduction to Web Development",
  code: "ABC123",
  description: "Learn the basics of HTML, CSS, and JavaScript",
  maxStudents: 50,
  startAt: new Date().toISOString(),
  roomId: "room1",
  roomName: "Computer Science 101",
};

// * Main Session Workspace Component
const SessionWorkspace = () => {

  // * Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Use HostSessionContext for all state
  const {
    socketRef,

    sessionData,
    setSessionData,

    activeView,
    setActiveView,

    participantsList,
    setParticipantsList,

    questions,
    setQuestions,

    activePoll,
    setActivePoll,

    pastPolls,
    setPastPolls,

    showPollForm,
    setShowPollForm,

    showConfirmClose,
    setShowConfirmClose,

    broadcastMessage,
    setBroadcastMessage,

    broadcastStatus,
    setBroadcastStatus,

    showBroadcastForm,
    setShowBroadcastForm,

    resetHostSession,
  } = useHostSession();

  // * Load session data from navigation state
  useEffect(() => {
    // * Getting Session Data from navigation state
    if (location.state?.sessionData) {
      // * Get State passed via navigation
      const passedSessionData = location.state.sessionData;
      const passedroomName = location.state.roomName;

      // * Debug log
      
      
      // * RoomId and RoomName handling
      const roomId = passedSessionData.roomId;
      const roomName = passedroomName ? passedroomName : "Unknown Room";

      // * Session Data with Room Name Object
      const newSessionData = {
        ...passedSessionData,
        roomName: roomName,
      };

      // * Set session data in context 
      setSessionData(newSessionData);
      // * Set Questions in context (mock data for now)
      setQuestions(MOCK_QUESTIONS);
    } else {
      // * Use mock data as fallback
      
    }
    
  }, [location]);

  // * Debug log session data changes
  useEffect(() => {
    
  }, [sessionData]);

  // Fetch participants from backend with debouncing
  const fetchTimeoutRef = useRef(null);

  const fetchParticipants = useCallback(
    (sessionCode) => {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Set a new timeout (300ms debounce)
      fetchTimeoutRef.current = setTimeout(async () => {
        try {
          
          const res = await api.get(
            `/api/sessions/code/${sessionCode}/participants`,{headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }}
          );
          setParticipantsList(res.data);
        } catch (err) {
          console.error("Failed to fetch participants:", err);
          setParticipantsList([]);
        }
      }, 300); // 300ms debounce time
    },
    [BACKEND_BASE_URL, setParticipantsList]
  );

  // Connect to socket.io backend on mount
  useEffect(() => {
    if (!sessionData?.code) return;
    // Fetch participants initially
    fetchParticipants(sessionData.code);
    // Fetch questions for this session
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/api/questions/session/${sessionData._id}`);
       
        // Normalize backend question shape to frontend expected fields
        const normalized = (res.data.questions || []).map((q) => ({
          id: q._id,
          text: q.text,
          upvotes: q.upvotes || 0,
          answered: !!q.isAnswered,
          isAnonymous: !!q.isAnonymous,
          studentName: q?.authorName || "N/A",
          timestamp: q.createdAt,
        }));
        setQuestions(normalized);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setQuestions([]);
      }
    };
    fetchQuestions();
    // Connect only once
    if (!socketRef.current) {
      const token = localStorage.getItem("accessToken");
      socketRef.current = io(SOCKET_URL, {
        autoConnect: true,
        withCredentials: true,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    }
    const socket = socketRef.current;
    // Log teacher socket ID
    socket.on("connect", () => {
      
    });
    socket.on("connect_error", (err) => {
      console.error("[Teacher] connect_error:", err.message);
    });
    socket.on("disconnect", (reason) => {
      
    });
    // Teacher joins session for presence
    socket.emit("join-session", {
      code: sessionData.code,
      participantId: "teacher1",
    });
    // Q&A socket listeners
    const onCreated = (payload) => {
      const q = payload.question;
      const normalized = {
        id: q._id,
        text: q.text,
        upvotes: q.upvotes || 0,
        answered: !!q.isAnswered,
        isAnonymous: !!q.isAnonymous,
        studentName: q.authorName || "N/A",
        timestamp: q.createdAt,
      };
      setQuestions((prev) => [normalized, ...prev]);
    };
    const onUpdated = (payload) => {
      const q = payload.question;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q._id
            ? {
              ...item,
              text: q.text || item.text,
              answered: !!q.isAnswered,
            }
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
          item.id === questionId ? { ...item, upvotes: (item.upvotes || 0) + delta } : item,
        ),
      );
    };
    const onAnswered = (payload) => {
      const { questionId } = payload;
      setQuestions((prev) => prev.map((item) => (item.id === questionId ? { ...item, answered: true } : item)));
    };

    socket.on('qna:question:created', onCreated);
    socket.on('qna:question:updated', onUpdated);
    socket.on('qna:question:deleted', onDeleted);
    socket.on('qna:question:upvoted', onUpvoted);
    socket.on('qna:question:answered', onAnswered);
    // Listen for room members
    socket.on("room:members", (data) => {
      
    });
    // Listen for participant count updates
    socket.on("participants:update", (data) => {
      
      // Refetch participants list whenever count changes
      fetchParticipants(sessionData.code);
    });
    // Optionally listen for broadcasted messages (if needed)
    socket.on("broadcast:message", (payload) => {
      // You can handle incoming broadcast messages here if needed
      // e.g., show a notification or update a chat
      
    });
    return () => {
      try {
        socket.emit("leave-session", {
          code: sessionData.code,
          participantId: "teacher1",
        });
      } catch { }
      socket.off("room:members");
      socket.off("participants:update");
      socket.off("broadcast:message");
      socket.off('qna:question:created', onCreated);
      socket.off('qna:question:updated', onUpdated);
      socket.off('qna:question:deleted', onDeleted);
      socket.off('qna:question:upvoted', onUpvoted);
      socket.off('qna:question:answered', onAnswered);
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;

      // Clear any pending fetch timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.code, fetchParticipants]);

  // Broadcast message to all students
  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("broadcast:teacher", {
      code: sessionData.code,
      teacherId: "teacher1",
      message: broadcastMessage,
    });
    setBroadcastStatus("Message sent!");
    setTimeout(() => setBroadcastStatus(""), 2000);
    setBroadcastMessage("");
    setShowBroadcastForm(false);
  };

  // Calculate the session duration
  const calculateDuration = () => {
    const startTime = new Date(sessionData.startAt);
    const currentTime = new Date();
    const diffMs = currentTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format a name to get initials
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Get background color based on name (for consistent colors)
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const hash = name.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return colors[hash % colors.length];
  };

  // Handle upvoting a question
  const handleUpvoteQuestion = (questionId) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
      )
    );
  };

  // Handle marking a question as answered
  const handleMarkAnswered = async (questionId) => {
    try {
      await api.patch(`/api/questions/${questionId}/answer`);
      // Socket event will update all clients' state
    } catch (err) {
      console.error('Failed to mark question as answered:', err);
      alert('Failed to mark question as answered');
    }
  };

  // Handle kicking a participant (UI only, backend action not implemented here)
  const handleKickParticipant = (participantId) => {
    setParticipantsList(
      participantsList.map((p) =>
        p._id === participantId ? { ...p, kicked: true } : p
      )
    );
  };

  const handleEndSession = async () => {
    console.log("Ending session...");
    if (!sessionData?.code) return;
    try {
      const res = await api.post(`/api/sessions/code/${sessionData.code}/close`);
      console.log("Closed CRUD...");
      

      if (res.status != 200) throw new Error("Failed to close session");
      // After successful close, emit socket event
      const socket = socketRef.current;
      if (socket) {
        console.log("Starting Ending session, socket emitted");
        socket.emit("session:end", { code: sessionData.code });
        console.log("Ending session, socket emitted");
      }else{
        console.log("Socket is null");
      }
      resetHostSession();
      console.log("Resetting session...");
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to close session. Please try again.");
    }
  };

  const sessionDuration = calculateDuration();
  return (
    <div className="bg-white dark:bg-gray-900 h-screen flex flex-col overflow-hidden">
      {/* Header with session info - Fixed height */}
      <SessionHeader
        sessionData={sessionData}
        sessionDuration={sessionDuration}
        onNavigateBack={() => navigate(-1)}
        onEndSession={() => setShowConfirmClose(true)}
      />

      {/* Main content area with grid layout - Takes remaining height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content area (2/3) */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 relative">
          {/* Floating Quick Actions Menu */}
          <QuickActions questions={questions} onSetActiveView={setActiveView} activeView={activeView} />

          {/* Main Content */}
          {activeView === "main" && (
            <MainContent/>
          )}

          {/* Poll Manager */}
          <PollManager/>

          {/* Q&A Manager */}
          <QAManager
            questions={questions}
            onUpvoteQuestion={handleUpvoteQuestion}
            onMarkAnswered={handleMarkAnswered}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </div>

        {/* Participants Sidebar */}
        <ParticipantList
          participants={participantsList}
          sessionData={sessionData}
          questions={questions}
          onKickParticipant={handleKickParticipant}
          onShowConfirmClose={() => setShowConfirmClose(true)}
          getInitials={getInitials}
          getAvatarColor={getAvatarColor}
          showBroadcastForm={showBroadcastForm}
          setShowBroadcastForm={setShowBroadcastForm}
          broadcastMessage={broadcastMessage}
          setBroadcastMessage={setBroadcastMessage}
          broadcastStatus={broadcastStatus}
          handleBroadcast={handleBroadcast}
        />
      </div>
          
      {/* Confirm Close Session Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                End Session?
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to end this session? All students will be
                disconnected and no more interactions will be possible.
              </p>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-500"
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
                  Session analytics will still be available after closing
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-500"
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
                  The room will remain active for future sessions
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionWorkspace;