import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Components import  */
import RoomList from "../../components/Host/dashboard/RoomList";
import CreateRoomModal from "../../components/Host/dashboard/CreateRoomModal";

/* Api import */
import api from "../../utils/api";

function RoomsPage() {
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
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
        const res = await api.get(`/api/rooms/?page=${currentPage}&limit=${pageSize}`);
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
      state: { room }
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
    </>
  );
}

export default RoomsPage;