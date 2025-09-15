import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Static data for demonstration
const MOCK_SESSION = {
  "_id": "68c32b9a72ccbff412c68573",
  "roomId": "68c1acaeb8545df5d77a1d3e",
  "roomName": "DBMS Lecture",
  "teacherId": "68c03b7690aa7d09254bb622",
  "title": "MongoDB Lecture Day 31",
  "code": "9DE8DD",
  "isActive": true,
  "maxStudents": 150,
  "participantCount": 32,
  "startAt": "2025-09-11T20:05:46.911Z",
  "createdAt": "2025-09-11T20:05:46.911Z",
  "updatedAt": "2025-09-11T20:05:46.911Z",
};

const MOCK_PARTICIPANTS = [
  { id: '1', name: 'Aarav Patel', isActive: true, joinedAt: '2025-09-11T20:07:12.000Z', avatar: null },
  { id: '2', name: 'Diya Sharma', isActive: true, joinedAt: '2025-09-11T20:07:23.000Z', avatar: null },
  { id: '3', name: 'Vihaan Gupta', isActive: true, joinedAt: '2025-09-11T20:08:05.000Z', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '4', name: 'Ananya Singh', isActive: true, joinedAt: '2025-09-11T20:08:17.000Z', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '5', name: 'Arjun Malhotra', isActive: true, joinedAt: '2025-09-11T20:08:56.000Z', avatar: null },
  { id: '6', name: 'Ishaan Mehta', isActive: true, joinedAt: '2025-09-11T20:09:22.000Z', avatar: null },
  { id: '7', name: 'Saanvi Kapoor', isActive: true, joinedAt: '2025-09-11T20:10:03.000Z', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: '8', name: 'Kabir Khanna', isActive: true, joinedAt: '2025-09-11T20:10:19.000Z', avatar: null },
  { id: '9', name: 'Aanya Reddy', isActive: false, joinedAt: '2025-09-11T20:11:02.000Z', avatar: null },
  { id: '10', name: 'Vivaan Joshi', isActive: true, joinedAt: '2025-09-11T20:12:45.000Z', avatar: 'https://randomuser.me/api/portraits/men/62.jpg' },
  { id: '11', name: 'Siya Choudhury', isActive: true, joinedAt: '2025-09-11T20:15:21.000Z', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
  { id: '12', name: 'Advait Sharma', isActive: true, joinedAt: '2025-09-11T20:17:05.000Z', avatar: null },
  { id: '13', name: 'Kashvi Verma', isActive: true, joinedAt: '2025-09-11T20:18:37.000Z', avatar: null },
  { id: '14', name: 'Atharva Kumar', isActive: true, joinedAt: '2025-09-11T20:20:14.000Z', avatar: null },
  { id: '15', name: 'Myra Nair', isActive: true, joinedAt: '2025-09-11T20:22:42.000Z', avatar: null },
  { id: '16', name: 'Reyansh Agarwal', isActive: true, joinedAt: '2025-09-11T20:24:18.000Z', avatar: null },
  { id: '17', name: 'Sara Saxena', isActive: true, joinedAt: '2025-09-11T20:25:51.000Z', avatar: null },
  { id: '18', name: 'Aditya Sharma', isActive: true, joinedAt: '2025-09-11T20:28:09.000Z', avatar: null },
  { id: '19', name: 'Pari Banerjee', isActive: true, joinedAt: '2025-09-11T20:30:27.000Z', avatar: null },
  { id: '20', name: 'Dhruv Chauhan', isActive: true, joinedAt: '2025-09-11T20:32:45.000Z', avatar: null },
];

const MOCK_QUESTIONS = [
  { 
    id: 'q1', 
    text: 'Can you explain the difference between SQL and NoSQL databases again?', 
    studentName: 'Aarav Patel', 
    studentId: '1', 
    isAnonymous: false, 
    timestamp: '2025-09-11T20:15:22.000Z', 
    upvotes: 12,
    answered: false 
  },
  { 
    id: 'q2', 
    text: 'What are the advantages of using MongoDB over traditional relational databases?', 
    studentName: null, 
    studentId: '7', 
    isAnonymous: true, 
    timestamp: '2025-09-11T20:18:05.000Z', 
    upvotes: 8,
    answered: false 
  },
  { 
    id: 'q3', 
    text: 'How do we handle one-to-many relationships in MongoDB?', 
    studentName: 'Ananya Singh', 
    studentId: '4', 
    isAnonymous: false, 
    timestamp: '2025-09-11T20:20:37.000Z', 
    upvotes: 5,
    answered: false 
  },
  { 
    id: 'q4', 
    text: 'Can we implement transactions in MongoDB? If yes, how?', 
    studentName: null, 
    studentId: '10', 
    isAnonymous: true, 
    timestamp: '2025-09-11T20:22:14.000Z', 
    upvotes: 4,
    answered: false 
  },
  { 
    id: 'q5', 
    text: 'What is sharding and when should we use it?', 
    studentName: 'Ishaan Mehta', 
    studentId: '6', 
    isAnonymous: false, 
    timestamp: '2025-09-11T20:25:46.000Z', 
    upvotes: 3,
    answered: false 
  },
];

const MOCK_POLLS = [
  {
    id: 'p1',
    question: 'Which of these is NOT a valid data type in MongoDB?',
    options: [
      { id: 'o1', text: 'ObjectId', votes: 3 },
      { id: 'o2', text: 'Date', votes: 2 },
      { id: 'o3', text: 'Decimal', votes: 8 },
      { id: 'o4', text: 'VARCHAR', votes: 15 }
    ],
    isActive: false,
    createdAt: '2025-09-11T20:10:00.000Z',
    endedAt: '2025-09-11T20:12:00.000Z',
    totalVotes: 28
  }
];

function SessionWorkspace() {
  const [activeView, setActiveView] = useState('main'); // main, polls, qa
  const [showPollForm, setShowPollForm] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [pollFormData, setPollFormData] = useState({
    question: '',
    options: ['', '', '', '']
  });
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);
  const [pastPolls, setPastPolls] = useState(MOCK_POLLS);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [sessionData, setSessionData] = useState(MOCK_SESSION);
  
const STATIC_ROOMS = [
  {
    "_id": "68c1acaeb8545df5d77a1d3e",
    "name": "DBMS Lecture",
    "description": "Database Management Systems for Computer Science students",
    "teacherId": "68c03b7690aa7d09254bb622",
    "defaultMaxStudents": 200,
    "createdAt": "2025-09-10T16:51:58.616Z",
    "activeSessions": 1,
    "totalSessions": 12
  },
  {
    "_id": "68c1aca7b8545df5d77a1d3a",
    "name": "BTECH B",
    "description": "MERN Stack Development for BTech students",
    "teacherId": "68c03b7690aa7d09254bb622",
    "defaultMaxStudents": 200,
    "createdAt": "2025-09-10T16:51:51.751Z",
    "activeSessions": 0,
    "totalSessions": 8
  },
  {
    "_id": "68c1aca7b8545df5d77a1d3b",
    "name": "Computer Networks",
    "description": "Advanced networking concepts and protocols",
    "teacherId": "68c03b7690aa7d09254bb622",
    "defaultMaxStudents": 150,
    "createdAt": "2025-09-09T14:30:00.000Z",
    "activeSessions": 0,
    "totalSessions": 5
  }
];

  const location = useLocation();
  const navigate = useNavigate();

  // Get session data from location state if available
  useEffect(() => {
    if (location.state && location.state.sessionData) {
      // If we have session data in the navigation state, use it
      const passedSessionData = location.state.sessionData;
      
      // Get room name for the session
      const roomId = passedSessionData.roomId;
      const room = STATIC_ROOMS.find(r => r._id === roomId);
      const roomName = room ? room.name : "Unknown Room";

      // Merge passed data with additional fields needed for display
      setSessionData({ 
        ...passedSessionData,
        roomName: roomName 
      });
      
      console.log("Session data loaded from navigation:", passedSessionData);
    } else {
      // Use mock data as fallback
      console.log("Using mock session data (no data passed in navigation)");
    }
  }, [location]);

  // Get the session start time in a readable format
  const sessionStartTime = new Date(sessionData.startAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

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
  const handleCreatePoll = (e) => {
    e.preventDefault();
    
    // Filter out any empty options
    const validOptions = pollFormData.options.filter(option => option.trim() !== '');
    
    if (pollFormData.question.trim() === '' || validOptions.length < 2) {
      alert('Please provide a question and at least 2 options');
      return;
    }
    
    const newPoll = {
      id: `p${Date.now()}`,
      question: pollFormData.question,
      options: validOptions.map((text, idx) => ({ id: `o${idx+1}`, text, votes: 0 })),
      isActive: true,
      createdAt: new Date().toISOString(),
      totalVotes: 0
    };
    
    setActivePoll(newPoll);
    setShowPollForm(false);
    setPollFormData({ question: '', options: ['', '', '', ''] });
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

  // Handle poll option change
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollFormData.options];
    newOptions[index] = value;
    setPollFormData({ ...pollFormData, options: newOptions });
  };

  // Handle adding a poll option
  const handleAddPollOption = () => {
    if (pollFormData.options.length < 6) {
      setPollFormData({
        ...pollFormData,
        options: [...pollFormData.options, '']
      });
    }
  };

  // Handle removing a poll option
  const handleRemovePollOption = (index) => {
    if (pollFormData.options.length > 2) {
      const newOptions = [...pollFormData.options];
      newOptions.splice(index, 1);
      setPollFormData({ ...pollFormData, options: newOptions });
    }
  };

  // Sort questions by upvotes
  const sortedQuestions = [...questions].sort((a, b) => b.upvotes - a.upvotes);

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

  // Count active participants
  const activeParticipantsCount = participants.filter(p => p.isActive).length;

  return (
    <div className="bg-white dark:bg-gray-900 h-screen flex flex-col overflow-hidden">
      {/* Header with session info - Fixed height */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md z-10 flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
              <div>
                <h1 className="text-lg font-bold truncate">{sessionData.title}</h1>
                <div className="flex items-center text-xs text-blue-100 space-x-3">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span>{sessionData.roomName}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span>{sessionData.code}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{calculateDuration()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowConfirmClose(true)}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-blue-700"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with grid layout - Takes remaining height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content area (2/3) */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 relative">
          {/* Floating Quick Actions Menu */}
          <div className="absolute bottom-4 left-4 z-30">
            <div className="flex space-x-2">
              <div className="relative group">
                <button
                  onClick={() => setActiveView('polls')}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Create Poll
                </div>
              </div>
              
              <div className="relative group">
                <button
                  onClick={() => setActiveView('qa')}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {questions.filter(q => !q.answered).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {questions.filter(q => !q.answered).length}
                    </span>
                  )}
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Q&A ({questions.filter(q => !q.answered).length})
                </div>
              </div>
              
              <div className="relative group">
                <button
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      document.documentElement.requestFullscreen();
                    }
                  }}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Full Screen
                </div>
              </div>
            </div>
          </div>
          {activeView === 'main' && (
            <div className="p-4 h-full flex flex-col items-center justify-center text-center">
              <div className="max-w-xl mx-auto">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to {sessionData.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Your session is active with {activeParticipantsCount} students currently joined.
                  </p>
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs dark:bg-green-900/30 dark:text-green-400">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    Live Session
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 text-left">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                      Student Engagement
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                      Create polls to check understanding or gather opinions.
                    </p>
                    <button
                      onClick={() => {
                        setActiveView('polls');
                        setShowPollForm(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Create Poll
                    </button>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 text-left">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                      Q&A Session
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                      View and answer student questions.
                    </p>
                    <button
                      onClick={() => setActiveView('qa')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Q&A ({questions.length})
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {activeParticipantsCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Students
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {questions.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Questions
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {pastPolls.length + (activePoll ? 1 : 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Polls
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                        {calculateDuration()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Duration
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'polls' && (
            <div className="p-3 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Polls</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveView('main')}
                    className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={() => setShowPollForm(true)}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Poll
                  </button>
                </div>
              </div>

              {activePoll && (
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg mb-8 overflow-hidden">
                  <div className="p-5 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Live Poll
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                        {activePoll.question}
                      </h3>
                    </div>
                    <button
                      onClick={handleEndPoll}
                      className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      End Poll
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="space-y-4">
                      {activePoll.options.map((option, index) => {
                        const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.votes, 0);
                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                        
                        return (
                          <div key={option.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {option.text}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {option.votes} votes ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                      Total responses: {activePoll.options.reduce((sum, opt) => sum + opt.votes, 0)} / {activeParticipantsCount} students
                    </div>
                  </div>
                </div>
              )}

              {pastPolls.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Past Polls</h3>
                  <div className="space-y-4">
                    {pastPolls.map((poll) => {
                      const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                      const winningOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
                      const winningPercentage = totalVotes > 0 
                        ? Math.round((winningOption.votes / totalVotes) * 100) 
                        : 0;
                      
                      return (
                        <div key={poll.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
                          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {poll.question}
                            </h4>
                            <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ended {new Date(poll.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="text-sm mb-3">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Most Popular Answer:
                              </span>{' '}
                              <span className="text-gray-900 dark:text-white">
                                "{winningOption.text}" ({winningPercentage}%)
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {poll.options.map((option) => {
                                const optionPercentage = totalVotes > 0 
                                  ? Math.round((option.votes / totalVotes) * 100) 
                                  : 0;
                                
                                return (
                                  <div key={option.id} className="flex items-center">
                                    <div 
                                      className={`w-3 h-3 rounded-full mr-2 ${
                                        option.id === winningOption.id 
                                          ? 'bg-green-500' 
                                          : 'bg-gray-300 dark:bg-gray-500'
                                      }`}
                                    ></div>
                                    <span className="text-gray-700 dark:text-gray-300 truncate">
                                      {option.text}
                                    </span>
                                    <span className="ml-auto text-gray-500 dark:text-gray-400">
                                      {optionPercentage}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                              Total responses: {totalVotes}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!activePoll && pastPolls.length === 0 && !showPollForm && (
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-8 text-center">
                  <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Polls Created Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create your first poll to check student understanding or gather opinions.
                  </p>
                  <button
                    onClick={() => setShowPollForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First Poll
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'qa' && (
            <div className="p-3 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Q&A Session ({sortedQuestions.length})
                </h2>
                <button
                  onClick={() => setActiveView('main')}
                  className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>

              {sortedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {sortedQuestions.map((question) => (
                    <div 
                      key={question.id} 
                      className={`bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden ${
                        question.answered ? 'border-l-4 border-green-500 dark:border-green-600' : ''
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start space-x-3">
                            <div>
                              <button 
                                onClick={() => handleUpvoteQuestion(question.id)}
                                className="flex flex-col items-center space-y-1"
                              >
                                <svg className="w-6 h-6 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {question.upvotes}
                                </span>
                              </button>
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white mb-1">{question.text}</p>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                {question.isAnonymous ? (
                                  <span>Anonymous Student</span>
                                ) : (
                                  <span>{question.studentName}</span>
                                )}
                                <span className="mx-2">•</span>
                                <span>{new Date(question.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {question.answered ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Answered
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMarkAnswered(question.id)}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark Answered
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-8 text-center">
                  <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Questions Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Students haven't asked any questions yet. They can submit questions anonymously or with their name.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Poll Form */}
          {showPollForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Poll</h3>
                    <button 
                      onClick={() => setShowPollForm(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <form onSubmit={handleCreatePoll}>
                  <div className="px-6 py-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Poll Question
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Which of these is NOT a MongoDB data type?"
                        value={pollFormData.question}
                        onChange={(e) => setPollFormData({...pollFormData, question: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options
                      </label>
                      {pollFormData.options.map((option, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            required={index < 2} // At least 2 options required
                          />
                          {index > 1 && ( // Can remove options beyond the first two
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(index)}
                              className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {pollFormData.options.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Option
                      </button>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPollForm(false)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      Launch Poll
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                      // In a real app, this would call an API to end the session
                      setShowConfirmClose(false);
                      window.history.back(); // Go back to dashboard
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

        {/* Students sidebar (1/3) - Fixed height with internal scroll */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
              <span>Students ({activeParticipantsCount})</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Max: {sessionData.maxStudents}</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {participants.filter(p => p.isActive).map((participant) => (
              <div 
                key={participant.id} 
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
              >
                <div className="flex items-center">
                  {participant.avatar ? (
                    <img 
                      src={participant.avatar} 
                      alt={participant.name} 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white ${getAvatarColor(participant.name)}`}>
                      {getInitials(participant.name)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {participant.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined {new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleKickParticipant(participant.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
              </div>
            ))}

            {participants.filter(p => !p.isActive).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Left the session
                </div>
                {participants.filter(p => !p.isActive).map((participant) => (
                  <div 
                    key={participant.id} 
                    className="flex items-center p-2 opacity-60"
                  >
                    {participant.avatar ? (
                      <img 
                        src={participant.avatar} 
                        alt={participant.name} 
                        className="w-8 h-8 rounded-full mr-3 grayscale"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white bg-gray-400 dark:bg-gray-600`}>
                        {getInitials(participant.name)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {participant.name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Left the session
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Quick Actions
            </h4>
            <div className="space-y-2">
              {/* <button
                onClick={() => setActiveView('polls')}
                className="w-full flex items-center p-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Launch a Poll
              </button>
              <button
                onClick={() => setActiveView('qa')}
                className="w-full flex items-center p-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Q&A ({questions.filter(q => !q.answered).length})
              </button> */}
              <button
                className="w-full flex items-center p-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Message All Students
              </button>
              <button
                onClick={() => setShowConfirmClose(true)}
                className="w-full flex items-center p-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionWorkspace;
