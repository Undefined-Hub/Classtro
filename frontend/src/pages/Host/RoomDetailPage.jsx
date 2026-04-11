import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

/* Components import  */
import RoomDetail from "../../components/Host/dashboard/RoomDetail";
import CreateSessionModal from "../../components/Host/dashboard/CreateSessionModal";
import ManageSessionModal from "../../components/Host/dashboard/ManageSessionModal";

/* Api import */
import api from "../../utils/api";
import toast from "../../utils/toastUtils";

function RoomDetailPage() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showManageSessionModal, setShowManageSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFormData, setSessionFormData] = useState({
    title: "",
    maxStudents: 200,
  });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [createSessionError, setCreateSessionError] = useState(null);
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  useEffect(() => {
    // Try to get room data from location state first
    if (location.state?.room) {
      setSelectedRoom(location.state.room);
    } else if (roomId) {
      // If no room data in state, fetch it from API
      fetchRoomData(roomId);
    }

    // Fetch sessions for the room
    if (roomId) {
      fetchRoomSessions(roomId);
    }
  }, [roomId, location.state]);

  const fetchRoomData = async (id) => {
    try {
      const res = await api.get(`/api/rooms/${id}`);
      if (res.status === 200) {
        setSelectedRoom(res.data);
      }
    } catch (error) {
      console.error("Error fetching room data:", error);
      // Navigate back to rooms if room not found
      navigate("/dashboard/rooms");
    }
  };

  const fetchRoomSessions = async (id) => {
    setSessionsLoading(true);
    setSessionsError(null);

    try {
      const res = await api.get(`/api/rooms/${id}/sessions`);

      if (res.status != 200) {
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

  const handleCreateSession = async (e) => {
    e.preventDefault();

    // Reset error state
    setCreateSessionError(null);

    // Set loading state
    setCreateSessionLoading(true);

    try {
      // Make API call to create session
      const res = await api.post(`/api/rooms/${roomId}/sessions`, {
        title: sessionFormData.title,
        maxStudents: sessionFormData.maxStudents,
      });

      // Check if response is ok
      if (res.status != 201) {
        const errorData = res.error;
        throw new Error(errorData || "Failed to create session");
      }

      // Parse response data
      const sessionData = res.data || {};

      // Update sessions state with the new session
      setSessions((prevSessions) => [sessionData, ...prevSessions]);

      // Close the modal
      setShowCreateSessionModal(false);

      // Reset form data
      setSessionFormData({ title: "", maxStudents: 200 });
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
    navigate("/dashboard/rooms");
  };

  const handleSessionClick = (session) => {
    // Navigate to the session workspace with session data as state
    navigate("/sessionWorkspace", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: selectedRoom ? selectedRoom.name : "",
      },
    });
  };

  const handleManageSession = (session) => {
    setSelectedSession(session);
    setShowManageSessionModal(true);
  };

  const handleUpdateSession = async (sessionId, updateData) => {
    try {
      const res = await api.patch(`/api/sessions/id/${sessionId}`, updateData);

      if (res.status !== 200) {
        throw new Error("Failed to update session");
      }

      const updatedSession = res.data;

      // Update the session in the sessions list
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session._id === sessionId ? updatedSession : session,
        ),
      );

      // Show success toast
      toast.success("Session updated successfully!");

      return updatedSession;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update session",
      );
    }
  };

  const handleDeleteSession = (deletedSessionId) => {
    // Remove the deleted session from the sessions list
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session._id !== deletedSessionId),
    );
    toast.success("Session deleted successfully!");
  };

  if (!selectedRoom) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading room...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={handleBackToRooms}
            className="hover:text-blue-600 dark:hover:text-blue-500 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
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
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-500 font-medium">
            {selectedRoom.name}
          </span>
        </div>
      </div>

      <RoomDetail
        room={selectedRoom}
        onBack={handleBackToRooms}
        onCreateSession={() => setShowCreateSessionModal(true)}
        onSessionClick={handleSessionClick}
        onManageSession={handleManageSession}
        onDeleteSession={handleDeleteSession}
        sessions={sessions}
        setSessions={setSessions}
        loading={sessionsLoading}
        error={sessionsError}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        onSubmit={handleCreateSession}
        formData={sessionFormData}
        setFormData={setSessionFormData}
        roomName={selectedRoom?.name}
        isLoading={createSessionLoading}
        error={createSessionError}
      />

      {/* Manage Session Modal */}
      <ManageSessionModal
        isOpen={showManageSessionModal}
        onClose={() => {
          setShowManageSessionModal(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onUpdate={handleUpdateSession}
      />
    </>
  );
}

export default RoomDetailPage;
