import React from "react";
import { User, Archive, LogOut } from "lucide-react";
import ProfileImageOrInitials from "../ProfileImageOrInitials";

const ProfileSidebar = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout,
  getInitials 
}) => {
  return (
    <div className="w-full lg:w-80">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] h-full flex flex-col">
        {/* Profile Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="relative inline-block">
            <ProfileImageOrInitials
              src={user?.profilePicture}
              alt={user?.name}
              name={user?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto"
              avatarColorClass="bg-blue-600"
              textSizeClass="text-2xl"
            />
          </div>
          <h2 className="mt-2 sm:mt-4 text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {user?.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            {user?.email}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            }`}
          >
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
            Profile
          </button>
          
          {user?.role === "TEACHER" && (
            <button
              onClick={() => setActiveTab("archived")}
              className={`w-full flex items-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "archived"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              }`}
            >
              <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
              Archived
            </button>
          )}
        </nav>

        {/* Logout Button at Bottom */}
        <div className="mt-2 sm:mt-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;