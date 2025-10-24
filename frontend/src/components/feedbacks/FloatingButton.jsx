import React from "react";
import { X, AlertCircle } from "lucide-react";

const FloatingButton = ({ isOpen, onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <button
        className={`w-12 h-12 rounded-full border-none shadow-md cursor-pointer flex items-center justify-center transition-all duration-300 ease-out ${
          isOpen
            ? "bg-gradient-to-br from-blue-400 to-blue-500 rotate-45 shadow-lg shadow-blue-400/20 dark:from-blue-500 dark:to-blue-600"
            : "bg-gradient-to-br from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-lg shadow-blue-500/20 dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-600/20"
        } text-white sm:w-14 sm:h-14`}
        onClick={onClick}
        aria-label="Report Bug or Feedback"
      >
        {isOpen ? (
          <X size={18} className="transition-all duration-300 sm:w-5 sm:h-5 -rotate-45" />
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
