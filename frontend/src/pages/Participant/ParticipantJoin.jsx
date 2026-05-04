import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import { useParticipantSession } from "../../context/ParticipantSessionContext.jsx";
import { STORAGE_KEY } from "../../context/ParticipantSessionContext.jsx";
import api from "../../utils/api.js";
import ProfileImageOrInitials from "../../components/ProfileImageOrInitials.jsx";

const ParticipantJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { setSessionData } = useParticipantSession();

  const [sessionCode, setSessionCode] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Extract code from URL params
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setSessionCode(code.toUpperCase());
      fetchSessionInfo(code.toUpperCase());
    } else {
      setError("No session code provided");
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch session info to display details
  const fetchSessionInfo = async (code) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/sessions/code/${code}`);
      setSessionInfo(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch session info:", err);
      setError("Session not found or invalid code");
    } finally {
      setLoading(false);
    }
  };

  // Handle joining the session
  const handleJoinSession = async () => {
    if (!sessionCode || !isAuthenticated) return;

    setJoining(true);
    setError("");

    try {
      // Call the same API as JoinSessionTab
      const res = await api.post(`/api/sessions/code/${sessionCode}/join`, {
        name: user?.name || "Anonymous Student",
      });

      if (res.status !== 200 && res.status !== 201) {
        const errorData = res.error;
        throw new Error(errorData || "Failed to join session");
      }

      const sessionData = res.data || {};

      // Save to storage and context, then navigate
      const fullData = { ...sessionData, joinCode: sessionCode };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
      } catch {}
      setSessionData(fullData);
      navigate("/participant/session");
    } catch (error) {
      console.error("❌ Failed to join session:", error);

      // Handle specific error cases
      if (error.response?.status === 403) {
        setError(
          "You are unable to join this session as you were kicked from it."
        );
      } else {
        setError(
          error.response?.data?.error ||
            error.message ||
            "Failed to join session. Please try again."
        );
      }
    } finally {
      setJoining(false);
    }
  };

  // Get initials for profile display
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate login redirect URL
  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(`/participant/join?code=${sessionCode}`)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:flex md:items-center md:justify-center md:p-8">
      <div className="max-w-sm mx-auto bg-white dark:bg-gray-800 h-screen md:h-auto md:max-w-md md:rounded-2xl md:shadow-xl md:min-h-0 md:w-full">
        {/* Header with Back Button and Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:p-6 md:rounded-t-2xl">
          <Link
            to="/participant/home"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center space-x-2">
            <img
              src="/apple-touch-icon.png"
              alt="Classtro"
              className="w-8 h-8 rounded-lg"
            />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:text-xl">
              Classtro
            </h1>
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center h-[calc(100vh-72px)] md:h-[400px] p-6 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Session Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {error}
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* Not Logged In State */
          <div className="flex flex-col h-[calc(100vh-72px)] md:h-auto">
            {/* Session Info */}
            {sessionInfo && (
              <div className="p-6 text-center border-b border-gray-100 dark:border-gray-700 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 md:text-xl">
                  {sessionInfo.title || "Live Session"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 md:text-base">
                  {sessionInfo.roomName || "Virtual Classroom"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2 md:text-sm">
                  # {sessionCode}
                </p>
              </div>
            )}

            {/* Login Required Message */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 md:w-20 md:h-20">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400 md:w-10 md:h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 md:text-xl">
                Login Required
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 md:text-base">
                Please log in to join this session
              </p>
            </div>

            {/* Login Button */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 md:p-6 md:rounded-b-2xl">
              <Link
                to={loginRedirectUrl}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors md:py-4"
              >
                Login and Join
              </Link>
            </div>
          </div>
        ) : (
          /* Logged In - Ready to Join State */
          <div className="flex flex-col h-[calc(100vh-72px)] md:h-auto">
            {/* Session Info Header */}
            {sessionInfo && (
              <div className="p-6 text-center border-b border-gray-100 dark:border-gray-700 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 md:text-xl">
                  {sessionInfo.title || "Live Session"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 md:text-base">
                  {sessionInfo.roomId.name || "Virtual Classroom"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2 md:text-sm">
                  # {sessionCode}
                </p>
              </div>
            )}

            {/* User Profile - Large Avatar like WhatsApp */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
              <div className="mb-6 md:mb-4 ">
                <ProfileImageOrInitials
                  src={user?.profilePicture}
                  alt={user?.name || "Student"}
                  initials={getInitials(user?.name)}
                  className="w-32 h-32 md:w-24 md:h-24 rounded-full"
                  avatarColorClass="bg-blue-600"
                  textColorClass="text-white text-3xl md:text-2xl font-bold"
                />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 md:text-lg">
                {user?.name || "Student"}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 md:text-base">
                {user?.email}
              </p>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 w-full">
                  <p className="text-sm text-red-700 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Join Button - Fixed at bottom like WhatsApp */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 md:p-6 md:rounded-b-2xl">
              <button
                onClick={handleJoinSession}
                disabled={joining}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {joining ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Joining...
                  </>
                ) : (
                  "Join Session"
                )}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 md:text-sm">
                Joining as {user?.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantJoin;
