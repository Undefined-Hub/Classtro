import React, { useState } from "react";
import { Copy, ArrowLeft, Check } from "lucide-react";

const SessionHeader = ({ sessionData, onNavigateBack, activeView }) => {
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
        <button
          onClick={onNavigateBack}
          className="fixed top-4 left-4 z-40 p-3 bg-blue-900/40 backdrop-blur-md border border-blue-700/30 text-white rounded-full hover:bg-blue-800/50 transition-all duration-200 shadow-lg"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Floating Join Banner */}
       {activeView === "main" && (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 group">
        <div 
          onClick={handleCopyLink}
          className="bg-blue-900/30 backdrop-blur-md border border-blue-700/40 text-white rounded-full px-6 py-3 cursor-pointer hover:bg-blue-800/40 transition-all duration-200 shadow-lg relative"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-200">Join at classtro.live | use code</span>
            <span className="font-mono font-bold text-white bg-blue-800/50 backdrop-blur-sm border border-blue-600/50 px-3 py-1 rounded-full text-sm tracking-wider">
              {sessionData.code}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-green-400 transition-colors" />
            ) : (
              <Copy className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
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
    </>
  );
};

export default SessionHeader;
