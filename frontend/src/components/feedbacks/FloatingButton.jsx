import React from "react";
import { X, AlertCircle } from "lucide-react";

const FloatingButton = ({ isOpen, onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <button
        className={`w-12 h-12 rounded-full border-none shadow-lg cursor-pointer flex items-center justify-center transition-all duration-300 ease-out ${
          isOpen
            ? "bg-gradient-to-br from-red-500 to-red-600 rotate-45 shadow-xl shadow-red-500/40 dark:from-red-600 dark:to-red-700"
            : "bg-gradient-to-br from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-xl shadow-blue-500/40 dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-600/40"
        } text-white sm:w-14 sm:h-14`}
        onClick={onClick}
        aria-label="Report Bug or Feedback"
      >
        {isOpen ? (
          <X size={18} className="transition-all duration-300 sm:w-5 sm:h-5" />
        ) : (
          <AlertCircle
            size={20}
            className="transition-all duration-300 sm:w-6 sm:h-6"
          />
        )}
      </button>
    </div>
  );
};

export default FloatingButton;
