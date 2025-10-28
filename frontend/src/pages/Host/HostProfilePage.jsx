import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LogoutModal from "../../components/LogoutModal";
import ProfileSidebar from "../../components/shared/ProfileSidebar";
import ProfileDetailsSection from "../../components/shared/ProfileDetailsSection";
import PasswordChangeSection from "../../components/shared/PasswordChangeSection";
import ArchivedRoomsSection from "../../components/Host/ArchivedRoomsSection";
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 h-full">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 h-full">
            {/* Left Sidebar */}
            <ProfileSidebar
              user={user}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
              userType="host"
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                {activeTab === "profile" && (
                  <div className="space-y-6 pb-8">
                    <ProfileDetailsSection
                      user={user}
                      isEditingProfile={isEditingProfile}
                      setIsEditingProfile={setIsEditingProfile}
                      profileForm={profileForm}
                      setProfileForm={setProfileForm}
                      onProfileUpdate={handleProfileUpdate}
                      userType="host"
                    />

                    {user?.authProvider === "LOCAL" ? (
                      <PasswordChangeSection
                        passwordForm={passwordForm}
                        setPasswordForm={setPasswordForm}
                        showPasswords={showPasswords}
                        setShowPasswords={setShowPasswords}
                        isChangingPassword={isChangingPassword}
                        onPasswordChange={handlePasswordChange}
                      />
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Password Management
                          </h3>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53 1.48 0 2.73.4 3.71 1.06L19.28 2.9C17.46 1.09 14.97.1 12 1z"/>
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                Google Account Authentication
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                Your password is managed by your Google account. To change your password, please visit your Google Account settings.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "archived" && (
                  <div className="pb-8">
                    <ArchivedRoomsSection
                      archivedRooms={archivedRooms}
                      archivedRoomsLoading={archivedRoomsLoading}
                      onUnarchiveRoom={handleUnarchiveRoom}
                    />
                  </div>
                )}
              </div>
            </div>
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