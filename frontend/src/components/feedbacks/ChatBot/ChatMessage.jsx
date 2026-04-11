import React from "react";
import { Bot, User } from "lucide-react";

const ChatMessage = ({ message, isBot }) => {
  // Parse message for formatting (bold, bullets, headings, code, etc.)
  const parseMessage = (text) => {
    if (!text) return null;

    // Split by lines
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();

      // Heading (### Title or **Title:** at start)
      if (trimmedLine.startsWith("###")) {
        const title = trimmedLine.replace(/^###\s*/, "");
        return (
          <h4
            key={lineIndex}
            className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 mt-1"
          >
            {parseInlineFormatting(title)}
          </h4>
        );
      }

      // Section header (line ending with colon and starts with **)
      if (trimmedLine.match(/^\*\*[^*]+\*\*:$/)) {
        return (
          <div
            key={lineIndex}
            className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1.5 mt-2"
          >
            {parseInlineFormatting(trimmedLine)}
          </div>
        );
      }

      // Numbered list (1. 2. 3.)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        return (
          <div key={lineIndex} className="flex gap-2 mb-1.5 ml-1">
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 min-w-[20px]">
              {numberedMatch[1]}.
            </span>
            <span className="flex-1">
              {parseInlineFormatting(numberedMatch[2])}
            </span>
          </div>
        );
      }

      // Bullet point
      const isBullet = /^[•\-\*]\s/.test(trimmedLine);
      if (isBullet) {
        const content = trimmedLine.replace(/^[•\-\*]\s/, "");
        return (
          <div key={lineIndex} className="flex gap-2 mb-1.5 ml-1">
            <span className="text-blue-500 dark:text-blue-400 font-bold flex-shrink-0">
              •
            </span>
            <span className="flex-1">{parseInlineFormatting(content)}</span>
          </div>
        );
      }

      // Code block or highlighted text (backticks)
      if (trimmedLine.match(/`[^`]+`/)) {
        return (
          <div key={lineIndex} className="mb-1.5">
            {parseInlineFormatting(trimmedLine)}
          </div>
        );
      }

      // Tip/Note boxes (💡 Tip: or ℹ️ Note:)
      const tipMatch = trimmedLine.match(/^(💡|ℹ️|⚠️|✅)\s*([^:]+):\s*(.+)$/);
      if (tipMatch) {
        const [, emoji, label, content] = tipMatch;
        const bgColors = {
          "💡": "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
          ℹ️: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          "⚠️": "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
          "✅": "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        };
        return (
          <div
            key={lineIndex}
            className={`${bgColors[emoji]} border-l-4 p-2 rounded-r mb-2 text-xs sm:text-sm`}
          >
            <span className="font-semibold">
              {emoji} {label}:
            </span>{" "}
            {parseInlineFormatting(content)}
          </div>
        );
      }

      // Regular line with inline formatting
      if (trimmedLine) {
        return (
          <p key={lineIndex} className="mb-1.5 last:mb-0 leading-relaxed">
            {parseInlineFormatting(trimmedLine)}
          </p>
        );
      }

      // Empty line (add spacing)
      return <div key={lineIndex} className="h-1.5" />;
    });
  };

  // Parse inline formatting like **bold**, `code`, etc.
  const parseInlineFormatting = (text) => {
    const parts = [];
    let currentIndex = 0;

    // Combined regex for **bold**, `code`
    const formatRegex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before formatted section
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      if (match[2]) {
        // **Bold text**
        parts.push(
          <strong
            key={match.index}
            className="font-semibold text-gray-900 dark:text-white"
          >
            {match[2]}
          </strong>,
        );
      } else if (match[3]) {
        // `Code or highlight`
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-[11px] sm:text-xs font-mono"
          >
            {match[3]}
          </code>,
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div
      className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${
        isBot ? "justify-start" : "justify-end"
      } animate-fadeIn`}
    >
      {isBot && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <Bot size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
          isBot
            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm"
            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm"
        }`}
      >
        <div className="text-xs sm:text-sm leading-relaxed break-words">
          {isBot ? (
            parseMessage(message)
          ) : (
            <p className="m-0 whitespace-pre-wrap">{message}</p>
          )}
        </div>
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
          <User size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
