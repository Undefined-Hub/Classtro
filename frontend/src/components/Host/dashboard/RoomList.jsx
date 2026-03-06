import React, { useState, useRef, useEffect } from "react";
import { Archive } from "lucide-react";

const RoomList = ({
  rooms,
  onRoomClick,
  onCreateRoom,
  onManageRoom,
  onArchiveRoom,
  onDeleteRoom,
  loading,
  error,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onNextPage,
  onPreviousPage,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e, roomId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === roomId ? null : roomId);
  };

  // Log room details for debugging
  useEffect(() => {
    if (rooms.length > 0) {
      console.log("Rooms data:", rooms);
      rooms.forEach(room => {
        console.log(`Room: ${room.name}`, {
          id: room._id,
          activeSessions: room.activeSessions,
          totalSessions: room.totalSessions,
          defaultMaxStudents: room.defaultMaxStudents,
          createdAt: room.createdAt
        });
      });
    }
  }, [rooms]);

  return (
  <div>
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
      My Classrooms
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create New Room Card */}
      {rooms.length > 0 && (
        <div
          className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          onClick={onCreateRoom}
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Create New Room
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Set up a new classroom for your students
          </p>
        </div>
      )}

      {/* Room Cards */}
      {rooms.length > 0
        ? rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 group relative"
              onClick={() => onRoomClick(room)}
            >
              {/* Header with title and menu */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 
                      className="text-xl font-bold text-gray-900 dark:text-white truncate"
                      title={room?.name}
                    >
                      {room?.name}
                    </h3>
                    <div className="flex items-center mt-2 space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${room.activeSessions > 0 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      ></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {room.activeSessions > 0 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  {/* 3-dot menu */}
                  <div className="relative group/menu" ref={openMenuId === room._id ? menuRef : null}>
                    <button
                      onClick={(e) => handleMenuClick(e, room._id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 relative z-10 hover:scale-105"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* Hover tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/menu:opacity-100 transition-all duration-300 ease-out pointer-events-none z-[100] group-hover/menu:translate-y-0 translate-y-1">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700 dark:border-gray-600 whitespace-nowrap backdrop-blur-sm">
                        <span className="font-medium">Options</span>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0">
                          <div className="border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {openMenuId === room._id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleMenuAction('manage', room);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group/item"
                        >
                          <span className="font-medium">Manage</span>
                          <svg className="w-4 h-4 text-gray-400 group-hover/item:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleMenuAction('archive', room);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group/item"
                        >
                          <span className="font-medium">Archive</span>
                          <Archive className="w-4 h-4 text-gray-400 group-hover/item:text-blue-500 transition-colors duration-200" />
                        </button>

                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleMenuAction('delete', room);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group/item"
                        >
                          <span className="font-medium">Delete</span>
                          <svg className="w-4 h-4 text-red-400 group-hover/item:text-red-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {room?.description || "No description provided"}
                </p>

                {/* Stats section */}
                <div className="space-y-3">
                  {/* Max Students */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Max Students</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {room?.defaultMaxStudents}
                    </span>
                  </div>

                  {/* Sessions badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {room.totalSessions} Sessions
                      </span>
                      
                      {room.activeSessions > 0 && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                          {room.activeSessions} Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
              </div>
            </div>
          ))
        : !loading &&
          !error && (
            <div className="col-span-2 md:col-span-3 lg:col-span-3 py-6 md:px-6 md:py-30 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No rooms found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {currentPage > 1
                    ? "You've reached the end of your rooms list. Navigate to previous pages or create a new room."
                    : "You haven't created any rooms yet. Create your first room to get started."}
                </p>
                <button
                  onClick={() =>
                    currentPage > 1 ? onPageChange(1) : onCreateRoom()
                  }
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {currentPage > 1 ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
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
                      Back to first page
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create New Room
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
    </div>

    {/* Pagination Controls */}
    {totalPages > 1 && rooms.length > 0 && (
      <div className="flex items-center justify-center mt-8">
        <nav className="flex items-center space-x-2" aria-label="Pagination">
          {/* Previous Page Button */}
          <button
            onClick={onPreviousPage}
            disabled={currentPage <= 1 || loading}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage <= 1 || loading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="sr-only">Previous</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          {[...Array(totalPages).keys()].map((page) => {
            // Only show nearby pages and first/last page to avoid long pagination
            const pageNumber = page + 1;
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    pageNumber === currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            } else if (
              (pageNumber === 2 && currentPage > 3) ||
              (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              // Show ellipsis
              return (
                <span
                  key={pageNumber}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  ...
                </span>
              );
            }
            return null;
          })}

          {/* Next Page Button */}
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages || loading}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage >= totalPages || loading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="sr-only">Next</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>
      </div>
    )}

    {/* Loading and Error States */}
    {loading && (
      <div className="flex justify-center mt-8">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading rooms...
        </div>
      </div>
    )}

    {error && !loading && (
      <div className="mt-8 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
        <p className="flex items-center">
          <svg
            className="h-5 w-5 mr-2"
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
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
        >
          Try again
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    )}
  </div>
  );
};

export default RoomList;
