import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Calendar, Edit3, Lock, Eye, EyeOff, ArrowLeft, LogOut, RotateCcw } from "lucide-react";
import ProfileImageOrInitials from "../../components/ProfileImageOrInitials";
import LogoutModal from "../../components/LogoutModal";
import toast from "react-hot-toast";
import api from "../../utils/api";

const HostProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    profilePicture: ""
  });

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Archived rooms states
  const [archivedRooms, setArchivedRooms] = useState([]);
  const [archivedRoomsLoading, setArchivedRoomsLoading] = useState(false);

  // Get user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchUserProfile();
    } else {
      console.error("No user ID found");
      toast.error("Please login again");
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "archived" && currentUser?.role === "TEACHER") {
      fetchArchivedRooms();
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/profile/${currentUser.id}`);
      
      if (response.data.success) {
        setUser(response.data.data);
        setProfileForm({
          name: response.data.data.name || "",
          username: response.data.data.username || "",
          profilePicture: response.data.data.profilePicture || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Check if at least one field is filled
    if (!profileForm.name && !profileForm.username && !profileForm.profilePicture) {
      toast.error("Please fill at least one field");
      return;
    }

    try {
      const updateData = {};
      if (profileForm.name.trim()) updateData.name = profileForm.name.trim();
      if (profileForm.username.trim()) updateData.username = profileForm.username.trim();
      if (profileForm.profilePicture.trim()) updateData.profilePicture = profileForm.profilePicture.trim();

      const response = await api.put(`/api/users/profile/${currentUser.id}`, updateData);
      
      if (response.data.success) {
        setUser(response.data.data);
        // Update localStorage
        const updatedUser = { ...currentUser, ...updateData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setIsEditingProfile(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await api.put(`/api/users/password/${currentUser.id}`, passwordForm);
      
      if (response.data.success) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        toast.success("Password changed successfully!");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/login");
  };

  const fetchArchivedRooms = async () => {
    try {
      setArchivedRoomsLoading(true);
      const response = await api.get(`/api/rooms/${currentUser.id}/archives?page=1&limit=10`);
      
      if (response.data.success) {
        setArchivedRooms(response.data.rooms);
      }
    } catch (error) {
      console.error("Error fetching archived rooms:", error);
      toast.error("Failed to load archived rooms");
    } finally {
      setArchivedRoomsLoading(false);
    }
  };

  const handleUnarchiveRoom = async (roomId) => {
    try {
      const response = await api.patch(`/api/rooms/${roomId}/unarchive`);
      
      if (response.data) {
        toast.success("Room unarchived successfully!");
        fetchArchivedRooms(); // Refresh the list
      }
    } catch (error) {
      console.error("Error unarchiving room:", error);
      toast.error("Failed to unarchive room");
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/dashboard/rooms")}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
              Profile Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <ProfileImageOrInitials
                    src={user?.profilePicture}
                    alt={user?.name}
                    initials={getInitials(user?.name)}
                    className="w-20 h-20 rounded-full mx-auto"
                    avatarColorClass="bg-blue-600"
                  />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                  {user?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                
                {user?.role === "TEACHER" && (
                  <button
                    onClick={() => setActiveTab("archived")}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "archived"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    Archived Rooms
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Profile Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Profile Details
                      </h3>
                      <button
                        onClick={() => {
                          setIsEditingProfile(!isEditingProfile);
                          if (isEditingProfile) {
                            // Reset form when canceling
                            setProfileForm({
                              name: user?.name || "",
                              username: user?.username || "",
                              profilePicture: user?.profilePicture || ""
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {isEditingProfile ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column - Profile Image */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <ProfileImageOrInitials
                            src={user?.profilePicture}
                            alt={user?.name}
                            initials={getInitials(user?.name)}
                            className="w-32 h-32 rounded-full"
                            avatarColorClass="bg-blue-600"
                          />
                          {isEditingProfile && (
                            <button className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                          {user?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>

                      {/* Right Column - Profile Information */}
                      <div className="space-y-6">
                        {isEditingProfile ? (
                          <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Username
                              </label>
                              <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter your username"
                              />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingProfile(false);
                                  setProfileForm({
                                    name: user?.name || "",
                                    username: user?.username || "",
                                    profilePicture: user?.profilePicture || ""
                                  });
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Mail className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.username || "Not set"}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Shield className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  {user?.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {new Date(user?.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
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

                {/* Change Password Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Change Password
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Update your account password
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="md:col-span-3 flex justify-end pt-4">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isChangingPassword && (
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "archived" && (
              <div className="space-y-6">
                {/* Archived Rooms Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Archived Rooms
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Manage your archived rooms and restore them when needed
                    </p>
                  </div>

                  <div className="p-6">
                    {archivedRoomsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : archivedRooms?.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                          <div
                            key={room._id}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                          >
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
                              onClick={() => handleUnarchiveRoom(room._id)}
                              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Restore Room
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default HostProfilePage;