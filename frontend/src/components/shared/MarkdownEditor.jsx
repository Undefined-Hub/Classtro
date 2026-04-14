import React, { useRef } from "react";
import { Bold, Italic, Code } from "lucide-react";

/**
 * MarkdownEditor - Textarea with live markdown preview overlay
 * Supports: **bold**, *italic*, _italic_, `code`
 * Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+` (code)
 */
const MarkdownEditor = ({
  value = "",
  onChange,
  maxLength = 5000,
  rows = 6,
  bottomLeftAdornment = null,
}) => {
  const textareaRef = useRef(null);

  // Convert markdown to HTML for display
  const markdownToHtml = (text) => {
    if (!text) return "";

    let html = text
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Bold: **text** and __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>')
      // Italic: *text* and _text_ (avoid **)
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em class="italic">$2</em>')
      .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em class="italic">$2</em>')
      // Inline code: `text`
      .replace(
        /`(.+?)`/g,
        '<code class="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>',
      )
      // Preserve line breaks
      .replace(/\n/g, "<br>");

    return html;
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    } else {
      onChange(newValue.substring(0, maxLength));
    }
  };

  const insertFormatting = (prefix, suffix, defaultText) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const text = selectedText || defaultText;
    const formatted = `${prefix}${text}${suffix}`;

    const newValue =
      value.substring(0, start) + formatted + value.substring(end);
    onChange(newValue);

    // Restore cursor position after the inserted text
    const cursorPos = start + formatted.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleKeyDown = (e) => {
    if (!textareaRef.current) return;

    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertFormatting("**", "**", "bold");
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertFormatting("*", "*", "italic");
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "`") {
      e.preventDefault();
      insertFormatting("`", "`", "code");
    }
  };

  const charCount = value.length;
  const charRemaining = maxLength - charCount;
  const isNearLimit = charRemaining < 100 && charRemaining >= 0;
  const isOverLimit = charRemaining < 0;

  return (
    <div className="space-y-0">
      {/* Toolbar - Icon only, above input */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg">
        <button
          type="button"
          onClick={() => insertFormatting("**", "**", "bold")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("*", "*", "italic")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting("`", "`", "code")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Code (Ctrl+`)"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          rows={rows}
          placeholder="Type your message... Use **bold**, *italic*, _italic_, or `code`."
          className="w-full pl-5 pr-5 py-3.5 pb-9 border border-gray-300 dark:border-gray-600 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        />
        {bottomLeftAdornment && (
          <div className="absolute bottom-2 left-2 z-10">
            {bottomLeftAdornment}
          </div>
        )}
        {/* Character count overlay */}
        <div className="absolute bottom-2 right-3 text-xs pointer-events-none z-10 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md">
          <span
            className={`font-medium ${
              isOverLimit
                ? "text-red-600 dark:text-red-400"
                : isNearLimit
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Preview - Separate block */}
      {value && (
        <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Preview:
          </p>
          <div
            className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
          />
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
