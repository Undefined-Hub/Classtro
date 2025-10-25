import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LogoutModal from "../../components/LogoutModal";
import ParticipantProfileSidebar from "../../components/Participant/ParticipantProfileSidebar";
import ParticipantProfileDetailsSection from "../../components/Participant/ParticipantProfileDetailsSection";
import ParticipantPasswordChangeSection from "../../components/Participant/ParticipantPasswordChangeSection";
import toast from "react-hot-toast";
import api from "../../utils/api";

const ParticipantProfilePage = () => {
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

  // Get user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchUserProfile();
    } else {
      toast.error("Please login to access your profile");
      navigate("/login");
    }
  }, [currentUser?.id, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching profile for user:", currentUser);
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
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      if (!profileForm.name && !profileForm.username && !profileForm.profilePicture) {
        toast.error("Please provide at least one field to update");
        return;
      }

      const updateData = {};
      if (profileForm.name.trim()) updateData.name = profileForm.name.trim();
      if (profileForm.username.trim()) updateData.username = profileForm.username.trim();
      if (profileForm.profilePicture.trim()) updateData.profilePicture = profileForm.profilePicture.trim();

      const response = await api.put(`/api/users/profile/${currentUser.id}`, updateData);
      
      if (response.data.success) {
        setUser(response.data.data);
        // Update localStorage
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setIsEditingProfile(false);
        toast.success("Profile updated successfully!");
        
        // Update the form with the latest data
        setProfileForm({
          name: response.data.data.name || "",
          username: response.data.data.username || "",
          profilePicture: response.data.data.profilePicture || ""
        });
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
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
    navigate("/");
  };

  const getInitials = (name) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile not found
          </h2>
          <button
            onClick={() => navigate("/participant/home")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back to home
          </button>
        </div>
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
              onClick={() => navigate("/participant/home")}
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
          <ParticipantProfileSidebar
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
                <ParticipantProfileDetailsSection
                  user={user}
                  isEditingProfile={isEditingProfile}
                  setIsEditingProfile={setIsEditingProfile}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  onProfileUpdate={handleProfileUpdate}
                  getInitials={getInitials}
                />

                <ParticipantPasswordChangeSection
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  showPasswords={showPasswords}
                  setShowPasswords={setShowPasswords}
                  isChangingPassword={isChangingPassword}
                  onPasswordChange={handlePasswordChange}
                />
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

export default ParticipantProfilePage;