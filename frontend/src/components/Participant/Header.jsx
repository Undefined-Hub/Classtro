import React from 'react';
import { useAuth } from '../../context/UserContext.jsx';

const Header = () => {
  const { user } = useAuth();

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'S';
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Student'}!</h1>
            <p className="text-blue-100 mt-1">Ready to join a learning session?</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-blue-100">Student ID</p>
              <p className="font-medium">{user?.email?.split('@')[0] || 'N/A'}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{getInitials(user?.name)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;