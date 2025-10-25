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

{user?.authProvider === "LOCAL" ? (
                  <ParticipantPasswordChangeSection
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