import React from "react";
import { Bot, User } from "lucide-react";

const ChatMessage = ({ message, isBot }) => {
  return (
    <div
      className={`flex gap-3 mb-4 ${
        isBot ? "justify-start" : "justify-end"
      } animate-fadeIn`}
    >
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <Bot size={18} className="text-white" />
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isBot
            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm"
            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0">
          {message}
        </p>
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
