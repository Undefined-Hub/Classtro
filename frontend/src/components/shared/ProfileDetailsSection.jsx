import React from "react";
import { User, Mail, Shield, Calendar, Edit3 } from "lucide-react";
import ProfileImageOrInitials from "../ProfileImageOrInitials";

const ProfileDetailsSection = ({
  user,
  isEditingProfile,
  setIsEditingProfile,
  profileForm,
  setProfileForm,
  onProfileUpdate,
  userType = "host", // "host" or "participant"
}) => {
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      name: user?.name || "",
      username: user?.username || "",
      profilePicture: user?.profilePicture || "",
    });
  };

  // Role-specific styling
  const getRoleConfig = () => {
    if (userType === "participant") {
      return {
        label: "STUDENT",
        colorClass:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    }
    return {
      label: user?.role || "USER",
      colorClass:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };
  };

  const roleConfig = getRoleConfig();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Profile Details
          </h3>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
          {/* Left Column - Profile Image */}
          <div className="flex flex-col items-center lg:justify-start">
            <div className="relative">
              <ProfileImageOrInitials
                src={user?.profilePicture}
                alt={user?.name}
                name={user?.name}
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full"
                avatarColorClass="bg-blue-600"
                textSizeClass="text-3xl sm:text-4xl"
              />
              {isEditingProfile && (
                <button className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 sm:p-2 shadow-lg transition-colors">
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center">
              {user?.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center break-all px-2">
              {user?.email}
            </p>
            {isEditingProfile && user?.authProvider === "GOOGLE" && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-xs">
                <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
                  Profile picture is managed by your Google account. To change
                  it, please update your Google account profile picture.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Profile Information */}
          <div className="space-y-4 sm:space-y-6">
            {isEditingProfile ? (
              <form
                onSubmit={onProfileUpdate}
                className="space-y-3 sm:space-y-4"
              >
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your username"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Full Name
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium truncate">
                      {user?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Email Address
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium break-all">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Username
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium truncate">
                      {user?.username || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Role
                    </p>
                    <span
                      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.colorClass}`}
                    >
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-start sm:items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Member Since
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {new Date(user?.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsSection;
