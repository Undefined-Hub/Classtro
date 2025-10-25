import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LogoutModal from "../../components/LogoutModal";
import ProfileSidebar from "../../components/Host/ProfileSidebar";
import ProfileDetailsSection from "../../components/Host/ProfileDetailsSection";
import PasswordChangeSection from "../../components/Host/PasswordChangeSection";
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Left Sidebar */}
          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            getInitials={getInitials}
          />

          {/* Main Content */}
          <div className="flex-1 min-h-[400px] sm:min-h-[600px]">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <ProfileDetailsSection
                  user={user}
                  isEditingProfile={isEditingProfile}
                  setIsEditingProfile={setIsEditingProfile}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  onProfileUpdate={handleProfileUpdate}
                  getInitials={getInitials}
                />

                <PasswordChangeSection
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  showPasswords={showPasswords}
                  setShowPasswords={setShowPasswords}
                  isChangingPassword={isChangingPassword}
                  onPasswordChange={handlePasswordChange}
                />
              </div>
            )}

            {activeTab === "archived" && (
              <ArchivedRoomsSection
                archivedRooms={archivedRooms}
                archivedRoomsLoading={archivedRoomsLoading}
                onUnarchiveRoom={handleUnarchiveRoom}
              />
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