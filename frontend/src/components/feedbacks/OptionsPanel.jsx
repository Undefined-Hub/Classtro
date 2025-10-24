import React from "react";
import { Heart, Bug } from "lucide-react";

const OptionsPanel = ({ isOpen, onOptionSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[100px] right-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 min-w-[180px] backdrop-blur-sm z-[9998] transition-all duration-300 sm:min-w-[200px]">
      <button
        className="w-full p-4 border-none bg-transparent rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 group"
        onClick={() => onOptionSelect("feedback")}
      >
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
          <Heart size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span>Submit Feedback</span>
      </button>
      <button
        className="w-full p-4 border-none bg-transparent rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 group"
        onClick={() => onOptionSelect("bug")}
      >
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
          <Bug size={18} className="text-red-600 dark:text-red-400" />
        </div>
        <span>Report Bug</span>
      </button>
    </div>
  );
};

export default OptionsPanel;
