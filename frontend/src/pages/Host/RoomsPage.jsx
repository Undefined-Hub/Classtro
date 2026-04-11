import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Components import  */
import RoomList from "../../components/Host/dashboard/RoomList";
import CreateRoomModal from "../../components/Host/dashboard/CreateRoomModal";
import ManageRoomModal from "../../components/Host/dashboard/ManageRoomModal";
import ConfirmationModal from "../../components/Host/dashboard/ConfirmationModal";

/* Api import */
import api from "../../utils/api";
import toast from "../../utils/toastUtils";

function RoomsPage() {
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showManageRoomModal, setShowManageRoomModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteRoomWithSessionsModal, setShowDeleteRoomWithSessionsModal] =
    useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeSessionsInRoom, setActiveSessionsInRoom] = useState([]);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    defaultMaxStudents: 200,
  });
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [createRoomLoading, setCreateRoomLoading] = useState(false);
  const [createRoomError, setCreateRoomError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
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
        const res = await api.get(
          `/api/rooms/?page=${currentPage}&limit=${pageSize}`,
        );
        if (res.status != 200) throw new Error("Failed to fetch rooms");
        const data = res.data || {};

        const fetchedRooms = data.rooms || [];

        // Fetch active sessions count for each room
        if (fetchedRooms.length > 0) {
          // Get teacher ID from localStorage or user data
          const userStr = localStorage.getItem("user");
          const user = userStr ? JSON.parse(userStr) : null;
          const teacherId = user?._id || user?.id;

          if (teacherId) {
            // Fetch active sessions for all rooms in parallel
            const roomsWithActiveSessions = await Promise.all(
              fetchedRooms.map(async (room) => {
                try {
                  const sessionsRes = await api.get(
                    `/api/sessions/active?teacherId=${teacherId}&roomId=${room._id}&limit=10`,
                  );
                  const activeSessions = sessionsRes.data || [];
                  console.log(
                    `Room ${room._id} has ${sessionsRes.data?.length || 0} active sessions`,
                  );
                  return {
                    ...room,
                    activeSessions: activeSessions.length,
                  };
                } catch (err) {
                  console.error(
                    `Failed to fetch active sessions for room ${room._id}:`,
                    err,
                  );
                  return {
                    ...room,
                    activeSessions: 0,
                  };
                }
              }),
            );
            setRooms(roomsWithActiveSessions);
          } else {
            // If no teacher ID, set activeSessions to 0
            setRooms(
              fetchedRooms.map((room) => ({ ...room, activeSessions: 0 })),
            );
          }
        } else {
          setRooms(fetchedRooms);
        }

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

  const handleRoomClick = (room) => {
    // Navigate to the specific room's sessions page
    navigate(`/dashboard/rooms/${room._id}`, {
      state: { room },
    });
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
      if (res.status != 201) {
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
    } catch (error) {
      // Handle error
      setCreateRoomError(error.message || "Failed to create room");
      console.error("Error creating room:", error);
    } finally {
      // Reset loading state
      setCreateRoomLoading(false);
    }
  };

  const handleManageRoom = (room) => {
    setSelectedRoom(room);
    setShowManageRoomModal(true);
  };

  const handleUpdateRoom = async (roomId, updateData) => {
    try {
      const res = await api.patch(`/api/rooms/${roomId}`, updateData);

      if (res.status !== 200) {
        throw new Error("Failed to update room");
      }

      const updatedRoom = res.data;

      // Update the room in the rooms list
      setRooms((prevRooms) =>
        prevRooms.map((room) => (room._id === roomId ? updatedRoom : room)),
      );

      // Show success toast
      toast.success("Room updated successfully!");

      return updatedRoom;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update room",
      );
    }
  };

  const handleArchiveRoom = async (room) => {
    setSelectedRoom(room);
    setShowArchiveConfirmModal(true);
  };

  const confirmArchiveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const res = await api.put(`/api/rooms/${selectedRoom._id}`);

      if (res.status !== 200) {
        throw new Error("Failed to archive room");
      }

      // Remove the room from the list
      setRooms((prevRooms) =>
        prevRooms.filter((r) => r._id !== selectedRoom._id),
      );

      // Show success toast
      toast.success(
        "Room archived successfully! You can restore it from settings.",
        {
          duration: 5000,
        },
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to archive room",
      );
    }
  };

  const handleDeleteRoom = async (room) => {
    setSelectedRoom(room);
    try {
      // Check for active sessions in this room
      const res = await api.get(`/api/rooms/${room._id}/sessions?active=true`);
      const activeSessions = res.data || [];

      if (activeSessions.length > 0) {
        // Show modal with active sessions warning
        setActiveSessionsInRoom(activeSessions);
        setShowDeleteRoomWithSessionsModal(true);
      } else {
        // No active sessions, show normal delete confirmation
        setShowDeleteConfirmModal(true);
      }
    } catch (err) {
      console.error("Error checking active sessions:", err);
      // If error, proceed to normal delete confirmation
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!selectedRoom) return;

    try {
      setIsDeletingRoom(true);

      // Check if we need to disconnect sockets (if there are active sessions)
      const hasActiveSessions = activeSessionsInRoom.length > 0;

      const res = await api.delete(`/api/rooms/${selectedRoom._id}/hard`, {
        data: {
          disconnectSockets: hasActiveSessions,
        },
      });

      if (res.status !== 200) {
        throw new Error("Failed to delete room");
      }

      // Remove the room from the list
      setRooms((prevRooms) =>
        prevRooms.filter((r) => r._id !== selectedRoom._id),
      );

      // Show success toast
      toast.success("Room deleted permanently!");

      // Close modals
      setShowDeleteConfirmModal(false);
      setShowDeleteRoomWithSessionsModal(false);
      setActiveSessionsInRoom([]);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete room",
      );
    } finally {
      setIsDeletingRoom(false);
    }
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
    <>
      <RoomList
        rooms={rooms}
        loading={roomsLoading}
        error={roomsError}
        onRoomClick={handleRoomClick}
        onCreateRoom={() => setShowCreateRoomModal(true)}
        onManageRoom={handleManageRoom}
        onArchiveRoom={handleArchiveRoom}
        onDeleteRoom={handleDeleteRoom}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
      />

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

      {/* Manage Room Modal */}
      <ManageRoomModal
        isOpen={showManageRoomModal}
        onClose={() => {
          setShowManageRoomModal(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onUpdate={handleUpdateRoom}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveConfirmModal}
        onClose={() => {
          setShowArchiveConfirmModal(false);
          setSelectedRoom(null);
        }}
        onConfirm={confirmArchiveRoom}
        title="Archive Room"
        confirmText="Archive Room"
        confirmType="primary"
      >
        <p className="mb-3">
          Are you sure you want to archive{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            "{selectedRoom?.name}"
          </span>
          ?
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-start">
            <svg
              className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0"
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
            <div>
              <p className="font-normal">
                Archived rooms can be restored and you can unarchive this room
                later from your settings.
              </p>
            </div>
          </div>
        </div>
      </ConfirmationModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setSelectedRoom(null);
        }}
        onConfirm={confirmDeleteRoom}
        title="Permanently Delete Room"
        confirmText="Delete Forever"
        confirmType="danger"
        requireTextConfirmation={true}
        textToType={`DELETE ${selectedRoom?.name}`}
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{selectedRoom?.name}"
            </span>
            ?
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z"
                />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-2">
                  This action cannot be undone!
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>
                    The room will be deleted permanently along with all
                    sessions, participant data, and associated content.
                  </li>
                  <li>
                    Once deleted, this data cannot be recovered or restored.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ConfirmationModal>

      {/* Delete Room with Active Sessions Modal */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${
          showDeleteRoomWithSessionsModal ? "block" : "hidden"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center p-6 pb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-red-100 dark:bg-red-900/30">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Room with Active Sessions?
              </h3>
            </div>
            <button
              onClick={() => {
                setShowDeleteRoomWithSessionsModal(false);
                setActiveSessionsInRoom([]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            <div className="text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                The room{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  "{selectedRoom?.name}"
                </span>{" "}
                has{" "}
                <span className="font-semibold">
                  {activeSessionsInRoom.length}
                </span>{" "}
                active session{activeSessionsInRoom.length !== 1 ? "s" : ""}.
              </p>
              <p className="mb-4">
                If you delete this room now, all participants in active sessions
                will be disconnected immediately.
              </p>
            </div>

            {/* Active Sessions List */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Active Sessions:
              </p>
              <ul className="space-y-2">
                {activeSessionsInRoom.map((session) => (
                  <li
                    key={session._id}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {session.title} ({session.participantCount || 0}{" "}
                    participants)
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z"
                  />
                </svg>
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-semibold mb-1">This action will:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Disconnect all participants from active sessions</li>
                    <li>Permanently delete the room and all its sessions</li>
                    <li>Remove all session data and analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteRoomWithSessionsModal(false);
                  setActiveSessionsInRoom([]);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                disabled={isDeletingRoom}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                disabled={isDeletingRoom}
              >
                {isDeletingRoom ? "Deleting..." : "Delete Room"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoomsPage;
