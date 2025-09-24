import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Components import  */
import RoomList from "../../components/Host/dashboard/RoomList";
import RoomDetail from "../../components/Host/dashboard/RoomDetail";
import AllSessionsTable from "../../components/Host/dashboard/AllSessionsTable";
import CreateRoomModal from "../../components/Host/dashboard/CreateRoomModal";
import CreateSessionModal from "../../components/Host/dashboard/CreateSessionModal";
import LogoutModal from "../../components/LogoutModal";

/* Api import */
import api from "../../utils/api";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:2000";

// !remove in production
const STATIC_SESSIONS = [
  {
    _id: "68c32b9a72ccbff412c68573",
    roomId: "68c1acaeb8545df5d77a1d3e",
    teacherId: "68c03b7690aa7d09254bb622",
    title: "MongoDB Lecture Day 31",
    code: "9DE8DD",
    isActive: true,
    maxStudents: 150,
    participantCount: 32,
    startAt: "2025-09-11T20:05:46.911Z",
    createdAt: "2025-09-11T20:05:46.911Z",
    updatedAt: "2025-09-11T20:05:46.911Z",
  },
  {
    _id: "68c32b9a72ccbff412c68574",
    roomId: "68c1acaeb8545df5d77a1d3e",
    teacherId: "68c03b7690aa7d09254bb622",
    title: "SQL Joins and Subqueries",
    code: "XYZ123",
    isActive: false,
    maxStudents: 200,
    participantCount: 187,
    startAt: "2025-09-09T14:30:00.000Z",
    createdAt: "2025-09-09T14:30:00.000Z",
    updatedAt: "2025-09-09T16:45:00.000Z",
  },
  {
    _id: "68c32b9a72ccbff412c68575",
    roomId: "68c1aca7b8545df5d77a1d3a",
    teacherId: "68c03b7690aa7d09254bb622",
    title: "React Hooks Introduction",
    code: "ABC456",
    isActive: false,
    maxStudents: 150,
    participantCount: 142,
    startAt: "2025-09-08T10:15:00.000Z",
    createdAt: "2025-09-08T10:15:00.000Z",
    updatedAt: "2025-09-08T12:00:00.000Z",
  },
];

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    defaultMaxStudents: 200,
  });
  const [sessionFormData, setSessionFormData] = useState({
    title: "",
    maxStudents: 200,
  });
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [createRoomLoading, setCreateRoomLoading] = useState(false);
  const [createRoomError, setCreateRoomError] = useState(null);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [createSessionError, setCreateSessionError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(11);
  const navigate = useNavigate();

  // Get auth token from useAuth context or localStorage
  // If you have a useAuth hook, use it here. Otherwise, fallback to localStorage.
  let token = null;
  try {
    // If you have a useAuth context, import and use it here
    // Example: const { token } = useAuth();
    // For now, fallback to localStorage
    token = localStorage.getItem("accessToken");
  } catch (e) {
    token = null;
  }

  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const res = await api.get(`/api/rooms/?page=${currentPage}&limit=${pageSize}`);
        if (res.statusText != "OK") throw new Error("Failed to fetch rooms");
        const data = res.data || {};

        // Set rooms from API response
        setRooms(data.rooms || []);

        // Set pagination data if available
        if (data.pagination) {
          const totalPages =
            data.pagination.totalPages ||
            Math.ceil(
              (data.pagination.totalItems || 1) /
                (data.pagination.pageSize || 20),
            );
          setTotalPages(totalPages);

          // Ensure current page is not greater than total pages
          setCurrentPage(
            Math.min(data.pagination.currentPage || 1, totalPages),
          );
          setPageSize(data.pagination.pageSize || 20);
        }
      } catch (err) {
        setRoomsError(err.message || "Error fetching rooms");
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, [token, currentPage, pageSize]);

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Anita Deshmukh",
    role: "TEACHER",
    email: "anita.deshmukh@example.com",
  };

  // No need to filter sessions here; RoomDetail fetches its own sessions

  const fetchRoomSessions = async (roomId) => {
    setSessionsLoading(true);
    setSessionsError(null);

    try {
      const res = await api.get(
        `/api/rooms/${roomId}/sessions`
      );

      if (res.statusText != "OK") {
        throw new Error("Failed to fetch sessions");
      }

      const data = res.data || {};
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessionsError(error.message || "Failed to fetch sessions");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setActiveTab("sessions");

    // Fetch sessions for the selected room
    fetchRoomSessions(room._id);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    // Reset error state
    setCreateRoomError(null);

    // Set loading state
    setCreateRoomLoading(true);

    try {

      // Make API call to create room
      const res = await api.post(`/api/rooms/`, {
          name: roomFormData.name,
          description: roomFormData.description,
          defaultMaxStudents: roomFormData.defaultMaxStudents,
      });

      // Check if response is ok
      if (res.statusText != "Created") {
        console.log("Error : ",res);
        const errorData = res.error;
        throw new Error(errorData || "Failed to create room");
      }

      // Parse response data
      const data = res.data || {};
      // Add new room to rooms list
      setRooms((prevRooms) => [data, ...prevRooms]);

      // Close the modal
      setShowCreateRoomModal(false);

      // Reset form data
      setRoomFormData({ name: "", description: "", defaultMaxStudents: 200 });

      // Show success message (you might want to add a toast notification here)
      console.log("Room created successfully:", data);
    } catch (error) {
      // Handle error
      setCreateRoomError(error.message || "Failed to create room");
      console.error("Error creating room:", error);
    } finally {
      // Reset loading state
      setCreateRoomLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    // Reset error state
    setCreateSessionError(null);

    // Set loading state
    setCreateSessionLoading(true);

    try {
      // Get auth token from localStorage

      // Make API call to create session
      const res = await api.post(`/api/rooms/${selectedRoom._id}/sessions`,{
            title: sessionFormData.title,
            maxStudents: sessionFormData.maxStudents,
          });

      // Check if response is ok
      if (res.statusText != "Created") {
        const errorData = res.error;
        throw new Error(errorData || "Failed to create session");
      }

      // Parse response data
      const sessionData = res.data || {};

      // Update sessions state with the new session
      // Add to the beginning of the array to show it at the top of the list
      setSessions((prevSessions) => [sessionData, ...prevSessions]);

      console.log("Session created successfully:", sessionData);

      // Close the modal
      setShowCreateSessionModal(false);

      // Reset form data
      setSessionFormData({ title: "", maxStudents: 200 });

      // // Optional: Navigate to the new session workspace
      // navigate('/test/sessionWorkspace', {
      //   state: {
      //     sessionId: sessionData._id,
      //     sessionData,
      //     roomId: sessionData.roomId,
      //     roomName: selectedRoom ? selectedRoom.name : ''
      //   }
      // });
    } catch (error) {
      // Handle error
      setCreateSessionError(error.message || "Failed to create session");
      console.error("Error creating session:", error);
    } finally {
      // Reset loading state
      setCreateSessionLoading(false);
    }
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setActiveTab("rooms");
  };

  const handleSessionClick = (session) => {
    // Navigate to the session workspace with session data as state
    console.log("Navigating to session:", session);
    navigate("/test/sessionWorkspace", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: selectedRoom ? selectedRoom.name : "",
      },
    });
  };

  const handleLogout = () => {
    // Show logout confirmation modal
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear user data and token
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    // Clear any other app state if needed

    // Close the modal
    setShowLogoutModal(false);

    // Redirect to login page
    navigate("/login");
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    // Make sure the new page is within valid range
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(validPage);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Sign Out
              </button>

              {/* {!selectedRoom ? (
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
              )} */}
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
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
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
                  onClick={() => setActiveTab("rooms")}
                  className={`py-4 px-2 text-sm font-medium border-b-2 ${
                    activeTab === "rooms"
                      ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500"
                      : "text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500"
                  }`}
                >
                  My Rooms
                </button>
                <button
                  onClick={() => setActiveTab("all-sessions")}
                  className={`py-4 px-2 text-sm font-medium border-b-2 ${
                    activeTab === "all-sessions"
                      ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500"
                      : "text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-500"
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
            sessions={sessions}
            setSessions={setSessions}
            loading={sessionsLoading}
            error={sessionsError}
          />
        ) : activeTab === "rooms" ? (
          <RoomList
            rooms={rooms}
            loading={roomsLoading}
            error={roomsError}
            onRoomClick={handleRoomClick}
            onCreateRoom={() => setShowCreateRoomModal(true)}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
          />
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              All Sessions
            </h2>
            {/* Search/filter/sort UI can be extracted if needed */}
            <AllSessionsTable
              sessions={STATIC_SESSIONS}
              rooms={rooms}
              onSessionClick={handleSessionClick}
            />
          </>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        open={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onSubmit={handleCreateRoom}
        formData={roomFormData}
        setFormData={setRoomFormData}
        isLoading={createRoomLoading}
        error={createRoomError}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateSessionModal && !!selectedRoom}
        onClose={() => setShowCreateSessionModal(false)}
        onSubmit={handleCreateSession}
        formData={sessionFormData}
        setFormData={setSessionFormData}
        roomName={selectedRoom?.name}
        isLoading={createSessionLoading}
        error={createSessionError}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default DashboardPage;
