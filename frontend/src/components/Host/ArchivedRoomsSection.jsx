import React from "react";
import { Archive, RotateCcw } from "lucide-react";

const ArchivedRoomsSection = ({
  archivedRooms,
  archivedRoomsLoading,
  onUnarchiveRoom
}) => {
  return (
    <div className="space-y-6">
      {/* Archived Rooms Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Archived Rooms
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your archived rooms and restore them when needed
          </p>
        </div>

        <div className="p-4">
          {archivedRoomsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : archivedRooms?.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Archived Rooms
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You haven't archived any rooms yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedRooms?.map((room) => (
                <RoomCard 
                  key={room._id} 
                  room={room} 
                  onUnarchive={onUnarchiveRoom}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RoomCard = ({ room, onUnarchive }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {room.name}
        </h4>
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
          Archived
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {room.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>ID: {room._id.slice(-6).toUpperCase()}</span>
        <span>{new Date(room.createdAt).toLocaleDateString()}</span>
      </div>
      <button
        onClick={() => onUnarchive(room._id)}
        className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:shadow-sm"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Restore Room
      </button>
    </div>
  );
};

export default ArchivedRoomsSection;