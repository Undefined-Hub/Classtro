import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import SessionHeader from '../../components/Host/sessionWorkspace/SessionHeader';
import MainContent from '../../components/Host/sessionWorkspace/MainContent';
import PollManager from '../../components/Host/sessionWorkspace/PollManager';
import QAManager from '../../components/Host/sessionWorkspace/QAManager';
import ParticipantList from '../../components/Host/sessionWorkspace/ParticipantList';
import QuickActions from '../../components/Host/sessionWorkspace/QuickActions';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";
const SOCKET_URL = BACKEND_BASE_URL + '/sessions';
console.log("Socket URL:", SOCKET_URL);
// Mock participants data
const MOCK_PARTICIPANTS = [
  { id: 'p1', name: 'Alice Johnson', avatar: null, joinedAt: new Date().toISOString(), isActive: true },
  { id: 'p2', name: 'Bob Smith', avatar: null, joinedAt: new Date().toISOString(), isActive: true },
  { id: 'p3', name: 'Charlie Davis', avatar: null, joinedAt: new Date().toISOString(), isActive: true },
  { id: 'p4', name: 'Diana Wilson', avatar: null, joinedAt: new Date().toISOString(), isActive: false },
];

// Mock questions data
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    text: 'What is the difference between SQL and NoSQL databases?',
    studentName: 'Alice Johnson',
    isAnonymous: false,
    timestamp: new Date().toISOString(),
    upvotes: 3,
    answered: false
  },
  {
    id: 'q2',
    text: 'How do you implement authentication in a web app?',
    studentName: '',
    isAnonymous: true,
    timestamp: new Date().toISOString(),
    upvotes: 7,
    answered: true
  }
];

// Mock session data fallback
const MOCK_SESSION_DATA = {
  _id: "session123",
  title: "Introduction to Web Development",
  code: "ABC123",
  description: "Learn the basics of HTML, CSS, and JavaScript",
  maxStudents: 50,
  startAt: new Date().toISOString(),
  roomId: "room1",
  roomName: "Computer Science 101"
};

function SessionWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [sessionData, setSessionData] = useState(MOCK_SESSION_DATA);
  const [activeView, setActiveView] = useState('main');
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [activePoll, setActivePoll] = useState(null);
  const [pastPolls, setPastPolls] = useState([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const socketRef = useRef(null);

  // Load session data from navigation state
  useEffect(() => {
    if (location.state?.sessionData) {
      const passedSessionData = location.state.sessionData;
      const passedroomName = location.state.roomName;
      // Find the room name based on roomId
      const roomId = passedSessionData.roomId;
      const roomName = passedroomName ? passedroomName : "Unknown Room";
      setSessionData({ 
        ...passedSessionData,
        roomName: roomName 
      });
    } else {
      // Use mock data as fallback
      console.log("Using mock session data (no data passed in navigation)");
    }
  }, [location]);

  // Connect to socket.io backend on mount
  useEffect(() => {
    if (!sessionData?.code) return;
    // Connect only once
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });
    }
    const socket = socketRef.current;
    // Log teacher socket ID
    socket.on('connect', () => {
      console.log('My socket ID (teacher):', socket.id);
    });
    // Teacher joins session for presence
    socket.emit('join-session', {
      code: sessionData.code,
      participantId: 'teacher1',
    });
    // Listen for room members
    socket.on('room:members', (data) => {
      console.log('Room members (teacher):', data.sockets);
    });
    // Optionally listen for broadcasted messages (if needed)
    socket.on('broadcast:message', (payload) => {
      // You can handle incoming broadcast messages here if needed
      // e.g., show a notification or update a chat
      console.log('Broadcast received:', payload);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionData?.code]);

  // Broadcast message to all students
  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('broadcast:teacher', {
      code: sessionData.code,
      teacherId: 'teacher1',
      message: broadcastMessage,
    });
    setBroadcastStatus('Message sent!');
    setTimeout(() => setBroadcastStatus(''), 2000);
    setBroadcastMessage('');
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
    
    return hours > 0 
      ? `${hours}h ${mins}m` 
      : `${mins}m`;
  };

  // Format a name to get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Get background color based on name (for consistent colors)
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  // Handle creating a new poll
  const handleCreatePoll = (question, options) => {
    const newPoll = {
      id: `p${Date.now()}`,
      question: question,
      options: options.map((text, idx) => ({ id: `o${idx+1}`, text, votes: 0 })),
      isActive: true,
      createdAt: new Date().toISOString(),
      totalVotes: 0
    };
    
    setActivePoll(newPoll);
    setActiveView('polls');
  };

  // Handle ending an active poll
  const handleEndPoll = () => {
    if (activePoll) {
      const endedPoll = {
        ...activePoll,
        isActive: false,
        endedAt: new Date().toISOString()
      };
      setPastPolls([endedPoll, ...pastPolls]);
      setActivePoll(null);
    }
  };

  // Handle upvoting a question
  const handleUpvoteQuestion = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
    ));
  };

  // Handle marking a question as answered
  const handleMarkAnswered = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, answered: true } : q
    ));
  };

  // Handle kicking a participant
  const handleKickParticipant = (participantId) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, isActive: false } : p
    ));
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
          <QuickActions 
            questions={questions}
            onSetActiveView={setActiveView}
          />

          {/* Main Content */}
          {activeView === 'main' && (
            <MainContent 
              sessionData={sessionData}
              participants={participants}
              questions={questions}
              pastPolls={pastPolls}
              activePoll={activePoll}
              calculateDuration={calculateDuration}
              onSetActiveView={setActiveView}
              onShowPollForm={setShowPollForm}
            />
          )}

          {/* Poll Manager */}
          <PollManager 
            activePoll={activePoll}
            pastPolls={pastPolls}
            showPollForm={showPollForm}
            setShowPollForm={setShowPollForm}
            onCreatePoll={handleCreatePoll}
            onEndPoll={handleEndPoll}
            activeView={activeView}
            setActiveView={setActiveView}
          />

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
          participants={participants}
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
                Are you sure you want to end this session? All students will be disconnected and no more interactions will be possible.
              </p>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Session analytics will still be available after closing
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                onClick={() => {
                  console.log('Session ended');
                  navigate('/dashboard');
                }}
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
}

export default SessionWorkspace;