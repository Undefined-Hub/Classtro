import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomList from '../../components/Host/dashboard/RoomList';
import RoomDetail from '../../components/Host/dashboard/RoomDetail';
import AllSessionsTable from '../../components/Host/dashboard/AllSessionsTable';
import CreateRoomModal from '../../components/Host/dashboard/CreateRoomModal';
import CreateSessionModal from '../../components/Host/dashboard/CreateSessionModal';


const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:2000";

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
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const navigate = useNavigate();

  // Get auth token from useAuth context or localStorage
  // If you have a useAuth hook, use it here. Otherwise, fallback to localStorage.
  let token = null;
  try {
    // If you have a useAuth context, import and use it here
    // Example: const { token } = useAuth();
    // For now, fallback to localStorage
    token = localStorage.getItem('accessToken');
  } catch (e) {
    token = null;
  }

  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/rooms/?page=1&limit=20`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        });
        if (!res.ok) throw new Error('Failed to fetch rooms');
        const data = await res.json();
        setRooms(data.rooms || []);
      } catch (err) {
        setRoomsError(err.message || 'Error fetching rooms');
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, [token]);

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { 
    name: 'Anita Deshmukh', 
    role: 'TEACHER',
    email: 'anita.deshmukh@example.com'
  };

  // No need to filter sessions here; RoomDetail fetches its own sessions

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
        sessionData: session,
        roomId: session.roomId,
        roomName: selectedRoom ? selectedRoom.name : ''
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
          <RoomDetail
            room={selectedRoom}
            onBack={handleBackToRooms}
            onCreateSession={() => setShowCreateSessionModal(true)}
            onSessionClick={handleSessionClick}
          />
        ) : (
          activeTab === 'rooms' ? (
            <RoomList
              rooms={rooms}
              loading={roomsLoading}
              error={roomsError}
              onRoomClick={handleRoomClick}
              onCreateRoom={() => setShowCreateRoomModal(true)}
            />
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Sessions</h2>
              {/* Search/filter/sort UI can be extracted if needed */}
              <AllSessionsTable
                sessions={STATIC_SESSIONS}
                rooms={rooms}
                onSessionClick={handleSessionClick}
              />
            </>
          )
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        open={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onSubmit={handleCreateRoom}
        formData={roomFormData}
        setFormData={setRoomFormData}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateSessionModal && !!selectedRoom}
        onClose={() => setShowCreateSessionModal(false)}
        onSubmit={handleCreateSession}
        formData={sessionFormData}
        setFormData={setSessionFormData}
        roomName={selectedRoom?.name}
      />
    </div>
  );
}

export default DashboardPage;
