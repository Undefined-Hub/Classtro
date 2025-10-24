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
  const [selectedRoom, setSelectedRoom] = useState(null);
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
  const [pageSize, setPageSize] = useState(11);
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
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room._id === roomId ? updatedRoom : room
        )
      );

      // Show success toast
      toast.success("Room updated successfully!");

      return updatedRoom;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Failed to update room");
    }
  };

  const handleArchiveRoom = async (room) => {
    setSelectedRoom(room);
    setShowArchiveConfirmModal(true);
  };

  const confirmArchiveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const res = await api.delete(`/api/rooms/${selectedRoom._id}`);
      
      if (res.status !== 200) {
        throw new Error("Failed to archive room");
      }

      // Remove the room from the list
      setRooms(prevRooms => prevRooms.filter(r => r._id !== selectedRoom._id));

      // Show success toast
      toast.success("Room archived successfully! You can restore it from settings.", {
        duration: 5000,
      });

    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to archive room");
    }
  };

  const handleDeleteRoom = async (room) => {
    setSelectedRoom(room);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (!selectedRoom) return;

    try {
      const res = await api.delete(`/api/rooms/${selectedRoom._id}/hard`);
      
      if (res.status !== 200) {
        throw new Error("Failed to delete room");
      }

      // Remove the room from the list
      setRooms(prevRooms => prevRooms.filter(r => r._id !== selectedRoom._id));

      // Show success toast
      toast.success("Room deleted permanently!");

    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete room");
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
          Are you sure you want to archive <span className="font-semibold text-gray-900 dark:text-white">"{selectedRoom?.name}"</span>?
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-normal">Archived rooms can be restored and you can unarchive this room later from your settings.</p>
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
            Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-white">"{selectedRoom?.name}"</span>?
          </p>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z" />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-2">This action cannot be undone!</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>The room will be deleted permanently along with all sessions, participant data, and associated content.</li>
                  <li>Once deleted, this data cannot be recovered or restored.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}

export default RoomsPage;
