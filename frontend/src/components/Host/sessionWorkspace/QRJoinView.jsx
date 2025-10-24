import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { Copy, X } from "lucide-react";

const QRJoinView = ({ sessionData, onClose, activeView, setActiveView }) => {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // 🔧 Stable QR generation (won’t go blank)
  useEffect(() => {
    if (!sessionData?.code || !qrRef.current || activeView !== "qr") return;

    const joinUrl = `${window.location.origin}/participant/join?code=${sessionData.code}`;

    // Clear any existing QR code
    qrRef.current.innerHTML = '';

    // Create fresh QR code instance with custom styling
    const qrCode = new QRCodeStyling({
      type: "canvas",
      shape: "square",
      width: 300,
      height: 300,
      data: joinUrl,
      margin: 0,
      image: "/apple-touch-icon.png",
      qrOptions: {
        typeNumber: "0",
        mode: "Byte",
        errorCorrectionLevel: "Q"
      },
      imageOptions: {
        saveAsBlob: true,
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 0
      },
      dotsOptions: {
        type: "rounded",
        color: "#000000",
        roundSize: true,
        gradient: null
      },
      backgroundOptions: {
        round: 0,
        color: "#ffffff"
      },
      cornersSquareOptions: {
        type: "",
        color: "#000000",
        gradient: null
      },
      cornersDotOptions: {
        type: "",
        color: "#000000"
      }
    });

    // Ensure DOM is ready before appending
    setTimeout(() => {
      if (qrRef.current) {
        qrCode.append(qrRef.current);
      }
    }, 10);

    // Cleanup
    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }
    };
  }, [sessionData?.code, activeView]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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

  if (activeView !== "qr") return null;

  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Session QR Code
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Share for students to join quickly
          </p>
        </div>
        <button
          onClick={() => setActiveView("main")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side - Session Info (your original UI) */}
        <div className="w-1/2 p-4 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {sessionData.title || "Live Session"}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {sessionData.roomName || "Virtual Classroom"}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8 text-center border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Session Code
              </h4>
              <div 
                onClick={handleCopyLink}
                className="text-6xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2 tracking-wider cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors select-none"
                title="Click to copy join link"
              >
                {sessionData.code}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {copied ? "Join link copied!" : "Click code to copy join link"}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white text-center">
                How to Join
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Scan the QR code with your phone camera
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Or click the session code to copy join link
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Right Side - Fixed QR Code */}
        <div className="w-1/2 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
              <div
                ref={qrRef}
                className="w-[300px] h-[300px] flex items-center justify-center"
              />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300 mt-4">
              Scan to Join Session
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Point your camera at the QR code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRJoinView;
