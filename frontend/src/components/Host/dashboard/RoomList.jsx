import React from 'react';

const RoomList = ({ rooms, onRoomClick, onCreateRoom }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Classrooms</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map(room => (
        <div 
          key={room._id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onRoomClick(room)}
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
              onClick={e => { e.stopPropagation(); onRoomClick(room); }}
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
        onClick={onCreateRoom}
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
);

export default RoomList;
