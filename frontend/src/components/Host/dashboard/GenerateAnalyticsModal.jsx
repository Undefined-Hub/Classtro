import React, { useState } from "react";
import { X, Loader, Check, Sparkles } from "lucide-react";
import api from "../../../utils/api";

const GenerateAnalyticsModal = ({ isOpen, onClose, session, onSuccess }) => {
  const [sections, setSections] = useState({
    participants: true,
    timeline: true,
    polls: true,
    qna: true,
    attendance: true,
    feedback: true,
    ai: false, // Premium feature
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const sectionInfo = {
    participants: {
      label: "Participant Statistics",
      description: "Duration, engagement, peak concurrent users",
      default: true,
    },
    timeline: {
      label: "Session Timeline",
      description: "Minute-by-minute participant activity",
      default: true,
    },
    polls: {
      label: "Poll Analytics",
      description: "Vote distributions and response rates",
      default: true,
    },
    qna: {
      label: "Q&A Insights",
      description: "Questions, answers, and engagement",
      default: true,
    },
    attendance: {
      label: "Attendance Report",
      description: "Join/leave times and duration breakdown",
      default: true,
    },
    feedback: {
      label: "Feedback Analysis",
      description: "Ratings, comments, and sentiment",
      default: true,
    },
    ai: {
      label: "AI Insights",
      description: "Smart recommendations and analysis",
      default: false,
      premium: true,
    },
  };

  const handleToggle = (key) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post(
        `/api/analytics/generate/${session._id}`,
        { sections }
      );

      if (response.data?.success) {
        console.log("✅ Analytics generated successfully");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("❌ Failed to generate analytics:", err);
      setError(
        err.response?.data?.message || "Failed to generate analytics. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAll = () => {
    setSections({
      participants: true,
      timeline: true,
      polls: true,
      qna: true,
      attendance: true,
      feedback: true,
      ai: sections.ai, // Don't auto-enable premium
    });
  };

  const handleSelectNone = () => {
    setSections({
      participants: false,
      timeline: false,
      polls: false,
      qna: false,
      attendance: false,
      feedback: false,
      ai: false,
    });
  };

  const selectedCount = Object.values(sections).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Generate Analytics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Session: {session?.title || "Unknown"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={handleSelectNone}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select None
              </button>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} selected
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Section Toggles */}
          <div className="space-y-3">
            {Object.entries(sectionInfo).map(([key, info]) => (
              <div
                key={key}
                className={`relative p-4 border rounded-xl transition-all ${
                  sections[key]
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                } ${info.premium ? "border-purple-200 dark:border-purple-800" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {info.label}
                      </h3>
                      {info.premium && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Premium
                        </span>
                      )}
                      {info.default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {info.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      sections[key]
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        sections[key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5">
                <svg
                  className="w-3 h-3 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Selected sections will be processed and stored. You can view
                  analytics immediately after generation. Larger sessions may
                  take a few seconds to process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedCount === 0}
            className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Generate Analytics</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateAnalyticsModal;
