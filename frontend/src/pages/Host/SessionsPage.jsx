import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Components import  */
import AllSessionsTable from "../../components/Host/dashboard/AllSessionsTable";

/* Api import */
import api from "../../utils/api";

function SessionsPage() {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const navigate = useNavigate();

  // Get auth token from localStorage
  let token = null;
  try {
    token = localStorage.getItem("accessToken");
  } catch (e) {
    token = null;
  }

  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        // Fetch all rooms to get all sessions data
        const res = await api.get(`/api/rooms/?page=1&limit=100`);
        if (res.status != 200) throw new Error("Failed to fetch rooms");
        const data = res.data || {};

        // Set rooms from API response
        setRooms(data.rooms || []);
      } catch (err) {
        setRoomsError(err.message || "Error fetching rooms");
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, [token]);

  const handleSessionClick = (session) => {
    // Navigate to the session workspace with session data as state
    navigate("/test/sessionWorkspace", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: session.roomName || "",
      },
    });
  };

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading sessions...
          </p>
        </div>
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium">Error loading sessions</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {roomsError}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        All Sessions
      </h2>
      <AllSessionsTable rooms={rooms} onSessionClick={handleSessionClick} />
    </>
  );
}

export default SessionsPage;
