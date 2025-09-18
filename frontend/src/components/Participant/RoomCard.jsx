import React from 'react';

const RoomCard = ({ room, onClick }) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'T';
  };

  const getRandomBanner = () => {
    const banners = ['banner1.jpg', 'banner2.jpg', 'banner3.jpg', 'banner4.jpg', 'banner5.jpg', 'banner6.jpg', 'banner7.jpg', 'banner8.jpg'];
    return banners[Math.floor(Math.random() * banners.length)];
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onClick?.(room)}
    >
      {/* Room Banner */}
      <div className="relative h-24 overflow-hidden rounded-t-lg">
        <img 
          src={room.bannerImage || `/${getRandomBanner()}`}
          alt={room.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Live Session Indicator */}
        {room.hasActiveSession && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
              Live
            </span>
          </div>
        )}
        
        {/* Teacher Avatar */}
        <div className="absolute top-2 right-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-800 text-xs font-medium border-2 border-white">
            {getInitials(room.teacherName)}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
            {room.name}
          </h3>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {room.teacherName}
        </p>
        
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {room.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {room.sessionCount} Sessions
          </div>
          
          {room.activeSessions > 0 && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              {room.activeSessions} Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;