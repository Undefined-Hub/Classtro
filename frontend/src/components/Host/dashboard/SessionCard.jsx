import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, BarChart3, Loader, Clock } from "lucide-react";
import GenerateAnalyticsModal from "./GenerateAnalyticsModal";
import api from "../../../utils/api";

const FEEDBACK_COLLECTION_TIMEOUT = 45; // seconds

const SessionCard = ({ session, onSessionClick, selectedRoom, onManageSession }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [analyticsStatus, setAnalyticsStatus] = useState(null); // null, 'generated', 'not-generated'
  const [checkingAnalytics, setCheckingAnalytics] = useState(false);
  const [feedbackTimeoutRemaining, setFeedbackTimeoutRemaining] = useState(0); // seconds
  const menuRef = useRef(null);

  // Check if analytics are generated when session is completed
  useEffect(() => {
    if (!session.isActive) {
      checkAnalyticsStatus();
    }
  }, [session._id, session.isActive]);

  // Handle feedback collection timeout countdown
  useEffect(() => {
    if (!session.isActive && session.endAt) {
      // Calculate time elapsed since session ended
      const endTime = new Date(session.endAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - endTime) / 1000);
      const remainingSeconds = Math.max(0, FEEDBACK_COLLECTION_TIMEOUT - elapsedSeconds);

      setFeedbackTimeoutRemaining(remainingSeconds);

      // Only set up countdown interval if still in timeout period
      if (remainingSeconds > 0) {
        const interval = setInterval(() => {
          setFeedbackTimeoutRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [session.isActive, session.endAt]);

  const checkAnalyticsStatus = async () => {
    try {
      setCheckingAnalytics(true);
      const response = await api.get(`/api/analytics/frontend/${session._id}`);
      if (response.data?.success) {
        setAnalyticsStatus(response.data.generated ? 'generated' : 'not-generated');
      }
    } catch (err) {
      console.error('Failed to check analytics status:', err);
      setAnalyticsStatus('not-generated');
    } finally {
      setCheckingAnalytics(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleManageClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    if (onManageSession) {
      onManageSession(session);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    // TODO: Implement session deletion when backend route is ready
    console.log("Delete session:", session._id);
    alert("Delete functionality will be implemented soon!");
  };

  const handleGenerateAnalytics = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowGenerateModal(true);
  };

  const handleViewAnalytics = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate("/analytics", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: selectedRoom ? selectedRoom.name : "",
      },
    });
  };

  const handleGenerationSuccess = () => {
    // Update status to generated and navigate
    setAnalyticsStatus('generated');
    handleViewAnalytics({ stopPropagation: () => {}, preventDefault: () => {} });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 group relative">
      {/* Active indicator bar */}
      <div
        className={`h-1 w-full ${session.isActive ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
      ></div>
      
      {/* Card content */}
      <div className="p-4">
        {/* Header with title and status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h4 
              className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate"
              title={session.title}
            >
              {session.title}
            </h4>
          </div>
          
          <div className="flex items-center space-x-1">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                session.isActive
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              {session.isActive ? "Active" : "Completed"}
            </span>

            {/* 3-dot menu */}
            <div className="relative group/menu" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 relative z-10 hover:scale-105"
              >
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Hover tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/menu:opacity-100 transition-all duration-300 ease-out pointer-events-none z-[9999] group-hover/menu:translate-y-0 translate-y-1">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-700 dark:border-gray-600 whitespace-nowrap backdrop-blur-sm">
                  <span className="font-medium">Options</span>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0">
                    <div className="border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              </div>

              {/* Menu dropdown */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[140px] z-50">
                  <button
                    onClick={handleManageClick}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group/item"
                  >
                    <span className="font-medium">Manage</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover/item:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  
                  {/* Delete Session Button */}
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group/item"
                  >
                    <span className="font-medium">Delete</span>
                    <svg className="w-4 h-4 text-red-400 group-hover/item:text-red-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session details */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4 space-y-3">
          {/* Session Code */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Session Code</span>
            </div>
            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
              {session.code}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Participants</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {session.participantCount}
              </span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session.maxStudents}
              </span>
            </div>
          </div>

          {/* Start Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Started</span>
            </div>
            <span className="text-sm text-gray-900 dark:text-white">
              {new Date(session.startAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="w-full">
          {session.isActive ? (
            <button
              onClick={() => onSessionClick(session)}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg group/btn"
            >
              <Play className="w-5 h-5 mr-2 group-hover/btn:animate-pulse" />
              Join Live Session
            </button>
          ) : (
            <>
              {checkingAnalytics && !analyticsStatus ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold transition-all duration-200 transform opacity-75"
                >
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </button>
              ) : analyticsStatus === 'generated' ? (
                <button
                  onClick={handleViewAnalytics}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </button>
              ) : feedbackTimeoutRemaining > 0 ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-semibold transition-all duration-200 cursor-wait opacity-75"
                  title="Waiting for feedback collection to complete"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Waiting for feedback ({feedbackTimeoutRemaining}s)
                </button>
              ) : (
                <button
                  onClick={handleGenerateAnalytics}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Generate Analytics
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Generate Analytics Modal */}
      <GenerateAnalyticsModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        session={session}
        onSuccess={handleGenerationSuccess}
      />
    </div>
  );
};

export default SessionCard;
