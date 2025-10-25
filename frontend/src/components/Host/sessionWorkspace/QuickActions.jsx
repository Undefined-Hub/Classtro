import React, { useState, useEffect } from "react";
import { BarChart3, ChartNoAxesColumn, HelpCircle, MessageCircleQuestionMark, Maximize, Minimize, Expand, Shrink, QrCode } from "lucide-react";

const QuickActions = ({ questions, onSetActiveView, activeView }) => {
  const unansweredQuestions = questions.filter((q) => !q.answered).length;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true); // Start visible
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hasInitiallyShown, setHasInitiallyShown] = useState(false);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initial reveal and hide animation
  useEffect(() => {
    // Show dock initially for 4 seconds to make users aware
    const initialHideTimer = setTimeout(() => {
      setIsDockVisible(false);
      setHasInitiallyShown(true);
    }, 4000);

    return () => clearTimeout(initialHideTimer);
  }, []);

  // Mouse tracking and dock visibility logic
  useEffect(() => {
    // Only start mouse tracking after initial reveal
    if (!hasInitiallyShown) return;

    let hideTimeout;

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Expanded trigger zone - bigger area for easier discovery
      const triggerZone = {
        bottom: window.innerHeight - 200, // Increased from 150px
        left: 300, // Increased from 200px
        top: window.innerHeight - 120, // Larger zone
        right: 0
      };

      const inTriggerZone = 
        e.clientX <= triggerZone.left && 
        e.clientY >= triggerZone.bottom;

      if (inTriggerZone) {
        setIsDockVisible(true);
        clearTimeout(hideTimeout);
      } else {
        // Hide dock after 2.5 seconds of mouse leaving trigger zone
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          setIsDockVisible(false);
        }, 2500);
      }
    };

    const handleMouseLeave = () => {
      // Hide dock when mouse leaves the window
      hideTimeout = setTimeout(() => {
        setIsDockVisible(false);
      }, 1000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideTimeout);
    };
  }, [hasInitiallyShown]);

  const handleToggle = (view) => {
    // If already active, close back to main; otherwise open requested view
    if (activeView === view) {
      onSetActiveView("main");
    } else {
      onSetActiveView(view);
    }
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handleQRCode = () => {
    // Toggle QR view
    if (activeView === "qr") {
      onSetActiveView("main");
    } else {
      onSetActiveView("qr");
    }
  };

  return (
    <>
      {/* Invisible trigger zone indicator (only visible in development) */}
      {import.meta.env.VITE_SHOW_DEBUG === 'true' && hasInitiallyShown && (
        <div className="fixed bottom-0 left-0 w-96 h-48 bg-blue-500/10 border border-blue-500/20 pointer-events-none z-20">
          <div className="text-xs text-blue-600 p-1">Expanded Dock Trigger Zone</div>
        </div>
      )}

      {/* Auto-hiding Dock Strip */}
      <div 
        className={`fixed bottom-3 left-3 z-50 transition-all duration-300 ease-in-out ${
          isDockVisible 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => setIsDockVisible(true)}
        onMouseLeave={() => {
          // Keep dock visible for a bit when mouse leaves, only if initial show is done
          if (hasInitiallyShown) {
            setTimeout(() => setIsDockVisible(false), 1500);
          }
        }}
      >
        {/* Dock Container */}
        <div className="bg-gray-800/90 dark:bg-white/10 backdrop-blur-md rounded-full px-3 py-2 shadow-xl border border-gray-700/50 dark:border-white/20">
          <div className="flex items-center space-x-2">
            
            {/* Polls Button */}
            <div className="relative group">
              <button
                onClick={() => handleToggle("polls")}
                className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                  activeView === "polls" 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600/50 dark:bg-white/10 hover:bg-gray-500/60 dark:hover:bg-white/20 text-white'
                }`}
                aria-pressed={activeView === "polls"}
              >
                <ChartNoAxesColumn className="w-4 h-4" />
              </button>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Polls
              </div>
            </div>

            {/* Q&A Button */}
            <div className="relative group">
              <button
                onClick={() => handleToggle("qa")}
                className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                  activeView === "qa" 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600/50 dark:bg-white/10 hover:bg-gray-500/60 dark:hover:bg-white/20 text-white'
                }`}
                aria-pressed={activeView === "qa"}
              >
                <MessageCircleQuestionMark className="w-4 h-4" />
                {unansweredQuestions > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unansweredQuestions > 9 ? '9+' : unansweredQuestions}
                  </span>
                )}
              </button>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Q&A ({unansweredQuestions})
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-400/60 dark:bg-white/20"></div>

            {/* Fullscreen Button */}
            <div className="relative group">
              <button
                onClick={handleFullscreen}
                className="w-9 h-9 bg-gray-600/50 dark:bg-white/10 hover:bg-gray-500/60 dark:hover:bg-white/20 text-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                {isFullscreen ? (
                  <Shrink className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              </div>
            </div>

            {/* QR Code Button */}
            <div className="relative group">
              <button
                onClick={handleQRCode}
                className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                  activeView === "qr" 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600/90 dark:bg-blue-600/80 hover:bg-blue-600 text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
              </button>
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                QR Code
              </div>
            </div>
            
          </div>
        </div>

        {/* Initial Hint Animation - only show during first reveal */}
        {!hasInitiallyShown && isDockVisible && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 ">
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-lg">
              Quick Actions
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-blue-600"></div>
          </div>
        )}

        {/* Dock Indicator Dot */}
        {/* <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white/30 rounded-full"></div> */}
      </div>
    </>
  );
};

export default QuickActions;
