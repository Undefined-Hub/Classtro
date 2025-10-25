import React, { useState } from "react";
import { Copy, ArrowLeft, Check } from "lucide-react";

const SessionHeader = ({ sessionData, onNavigateBack, activeView, isParticipantListOpen = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const joinUrl = `${window.location.origin}/participant/join?code=${sessionData.code}`;
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* Floating Back Button - Only show on main view */}
      {activeView === "main" && (
        <div className="group relative">
          <button
            onClick={onNavigateBack}
            className="fixed top-4 left-4 z-40 p-3 bg-blue-600/90 dark:bg-blue-900/40 backdrop-blur-md border border-blue-500/40 dark:border-blue-700/30 text-white rounded-full hover:bg-blue-700/90 dark:hover:bg-blue-800/50 transition-all duration-200 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Custom Tooltip */}
          <div className="fixed top-5 left-16 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-300 pointer-events-none group-hover:scale-100 scale-95">
            <div className="bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg border border-gray-800">
              Back to dashboard
            </div>
          </div>
        </div>
      )}

      {/* Floating Join Banner */}
       {activeView === "main" && (
      <div className={`fixed top-4 z-40 group transition-all duration-300 ${
        isParticipantListOpen 
          ? 'left-1/2 transform -translate-x-[calc(70%+100px)]' // Shift left by half participant list width
          : 'left-1/2 transform -translate-x-1/2'
      }`}>
        <div 
          onClick={handleCopyLink}
          className="bg-blue-600/85 dark:bg-blue-900/30 backdrop-blur-md border border-blue-500/50 dark:border-blue-700/40 text-white rounded-full px-6 py-3 cursor-pointer hover:bg-blue-700/85 dark:hover:bg-blue-800/40 transition-all duration-200 shadow-lg relative"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-50 dark:text-gray-200">Join at classtro.live | use code</span>
            <span className="font-mono font-bold text-white bg-blue-700/70 dark:bg-blue-800/50 backdrop-blur-sm border border-blue-500/60 dark:border-blue-600/50 px-3 py-1 rounded-full text-sm tracking-wider">
              {sessionData.code}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-green-400 transition-colors" />
            ) : (
              <Copy className="w-4 h-4 text-blue-100 dark:text-gray-300 group-hover:text-white transition-colors" />
            )}
          </div>

          {/* Custom Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              {copied ? "Link copied!" : "Click to copy participation link"}
              {/* Tooltip Arrow */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-black"></div>
            </div>
          </div>
        </div>
      </div>
       )}

      {/* Classtro Logo and Branding - Right Side */}
      {activeView === "main" && (
        <div className={`fixed top-4 z-40 transition-all duration-300 ${
          isParticipantListOpen 
            ? 'right-[336px]' // 320px (participant list width) + 16px (original right-4)
            : 'right-4'
        }`}>
          <div className="flex items-center gap-3 bg-blue-600/80 dark:bg-blue-900/20 backdrop-blur-md border border-blue-500/50 dark:border-blue-700/30 text-white rounded-full px-4 py-2 shadow-lg">
            <img 
              src="/apple-touch-icon.png" 
              alt="Classtro Logo" 
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm font-semibold text-white">
              Classtro
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionHeader;
