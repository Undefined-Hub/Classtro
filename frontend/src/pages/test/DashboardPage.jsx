import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Static data for rooms and sessions
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

const STATIC_SESSIONS = [
  {
    "_id": "68c32b9a72ccbff412c68573",
    "roomId": "68c1acaeb8545df5d77a1d3e",
    "teacherId": "68c03b7690aa7d09254bb622",
    "title": "MongoDB Lecture Day 31",
    "code": "9DE8DD",
    "isActive": true,
    "maxStudents": 150,
    "participantCount": 32,
    "startAt": "2025-09-11T20:05:46.911Z",
    "createdAt": "2025-09-11T20:05:46.911Z",
    "updatedAt": "2025-09-11T20:05:46.911Z",
  },
  {
    "_id": "68c32b9a72ccbff412c68574",
    "roomId": "68c1acaeb8545df5d77a1d3e",
    "teacherId": "68c03b7690aa7d09254bb622",
    "title": "SQL Joins and Subqueries",
    "code": "XYZ123",
    "isActive": false,
    "maxStudents": 200,
    "participantCount": 187,
    "startAt": "2025-09-09T14:30:00.000Z",
    "createdAt": "2025-09-09T14:30:00.000Z",
    "updatedAt": "2025-09-09T16:45:00.000Z",
  },
  {
    "_id": "68c32b9a72ccbff412c68575",
    "roomId": "68c1aca7b8545df5d77a1d3a",
    "teacherId": "68c03b7690aa7d09254bb622",
    "title": "React Hooks Introduction",
    "code": "ABC456",
    "isActive": false,
    "maxStudents": 150,
    "participantCount": 142,
    "startAt": "2025-09-08T10:15:00.000Z",
    "createdAt": "2025-09-08T10:15:00.000Z",
    "updatedAt": "2025-09-08T12:00:00.000Z",
  }
];

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState({ name: '', description: '', defaultMaxStudents: 200 });
  const [sessionFormData, setSessionFormData] = useState({ title: '', maxStudents: 200 });
  const navigate = useNavigate();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { 
    name: 'Anita Deshmukh', 
    role: 'TEACHER',
    email: 'anita.deshmukh@example.com'
  };

  // Filter sessions for selected room
  const roomSessions = selectedRoom 
    ? STATIC_SESSIONS.filter(session => session.roomId === selectedRoom._id)
    : [];

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setActiveTab('sessions');
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    // In a real app, you would send this data to your API
    console.log('Creating room with data:', roomFormData);
    setShowCreateRoomModal(false);
    // Reset form data
    setRoomFormData({ name: '', description: '', defaultMaxStudents: 200 });
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    // In a real app, you would send this data to your API
    console.log('Creating session with data:', { ...sessionFormData, roomId: selectedRoom._id });
    setShowCreateSessionModal(false);
    // Reset form data
    setSessionFormData({ title: '', maxStudents: 200 });
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setActiveTab('rooms');
  };

  const handleSessionClick = (session) => {
    // Navigate to the session workspace with session data as state
    navigate('/test/sessionWorkspace', { 
      state: { 
        sessionId: session._id,
        roomId: session.roomId,
        sessionData: session
      } 
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
              <p className="text-blue-100">Welcome back, {user.name}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {!selectedRoom ? (
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Room
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateSessionModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center space-x-4">
            {selectedRoom ? (
              <>
                <button 
                  onClick={handleBackToRooms}
                  className="py-4 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Rooms
                </button>
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <span className="py-4 px-2 text-sm font-medium text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500">
                  {selectedRoom.name}
                </span>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`py-4 px-2 text-sm font-medium border-b-2 ${
                    activeTab === 'rooms'
                      ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500'
                  }`}
                >
                  My Rooms
                </button>
                <button
                  onClick={() => setActiveTab('all-sessions')}
                  className={`py-4 px-2 text-sm font-medium border-b-2 ${
                    activeTab === 'all-sessions'
                      ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500'
                  }`}
                >
                  All Sessions
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {selectedRoom ? (
          // Room Detail View with Sessions
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRoom.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedRoom.description}</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Max: {selectedRoom.defaultMaxStudents} students
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created: {new Date(selectedRoom.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sessions</h3>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
                <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sort
                </button>
              </div>
            </div>

            {roomSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomSessions.map(session => (
                  <div key={session._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className={`h-2 rounded-t-lg ${session.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{session.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {session.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Session Code:</span>
                          <span className="font-mono font-medium text-gray-900 dark:text-white">{session.code}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Participants:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{session.participantCount} / {session.maxStudents}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Started:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{new Date(session.startAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-5 flex space-x-2">
                        {session.isActive ? (
                          <>
                            <button 
                              onClick={() => handleSessionClick(session)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Manage
                            </button>
                            <button className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleSessionClick(session)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Report
                            </button>
                            <button className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Sessions Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created any sessions for this room yet.
                </p>
                <button
                  onClick={() => setShowCreateSessionModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Session
                </button>
              </div>
            )}
          </div>
        ) : (
          // Rooms List or All Sessions View
          activeTab === 'rooms' ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Classrooms</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STATIC_ROOMS.map(room => (
                  <div 
                    key={room._id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleRoomClick(room)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                        <div className={`w-3 h-3 rounded-full ${room.activeSessions > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>
                      
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-gray-500 dark:text-gray-400">Max Students:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{room.defaultMaxStudents}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {room.totalSessions} Sessions
                          </span>
                        </div>
                        <div>
                          {room.activeSessions > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {room.activeSessions} Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoomClick(room);
                        }}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
                      >
                        <span>Manage</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Create New Room Card */}
                <div 
                  className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setShowCreateRoomModal(true)}
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Create New Room</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Set up a new classroom for your students
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // All Sessions View
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Sessions</h2>
              
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="search" 
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Search sessions" 
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                  </button>
                  <button className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Sort
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Room
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Students
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {STATIC_SESSIONS.map(session => {
                        const room = STATIC_ROOMS.find(r => r._id === session.roomId);
                        return (
                          <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{session.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">{room?.name || 'Unknown'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                session.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {session.isActive ? 'Active' : 'Completed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-500 dark:text-gray-400">{session.code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {session.participantCount} / {session.maxStudents}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(session.startAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button 
                                onClick={() => handleSessionClick(session)}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                              >
                                {session.isActive ? 'Manage' : 'View'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Room</h3>
                <button 
                  onClick={() => setShowCreateRoomModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., DBMS Lecture"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({...roomFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter a brief description of this room"
                    rows="3"
                    value={roomFormData.description}
                    onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Max Students
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., 200"
                    value={roomFormData.defaultMaxStudents}
                    onChange={(e) => setRoomFormData({...roomFormData, defaultMaxStudents: parseInt(e.target.value)})}
                    min="1"
                    max="1000"
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Session</h3>
                <button 
                  onClick={() => setShowCreateSessionModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateSession}>
              <div className="px-6 py-4">
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Creating session for room: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedRoom.name}</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Lecture 1: Introduction"
                    value={sessionFormData.title}
                    onChange={(e) => setSessionFormData({...sessionFormData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Students
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={`Default: ${selectedRoom.defaultMaxStudents}`}
                    value={sessionFormData.maxStudents}
                    onChange={(e) => setSessionFormData({...sessionFormData, maxStudents: parseInt(e.target.value)})}
                    min="1"
                    max="1000"
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
