import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import URLPreviewCard from "../../shared/URLPreviewCard";
import FilePreviewCard from "../../shared/FilePreviewCard";
import MarkdownEditor from "../../shared/MarkdownEditor";
import ReactionPicker from "../../shared/ReactionPicker";
import safeToast from "../../../utils/toastUtils";


const BroadcastModal = ({
  isOpen,
  onClose,
  onSendBroadcast,
  broadcastHistory = [],
  loading = false,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState("send"); // 'send' or 'history'
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachmentMenu]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await onSendBroadcast({
        message: message.trim(),
        files: selectedFiles,
      });
      setMessage("");
      setSelectedFiles([]);
      // Switch to history tab after sending
      setActiveTab("history");
    } catch (error) {
      console.error("Failed to send broadcast:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate file count
    if (selectedFiles.length + files.length > 3) {
      safeToast.error("Maximum 3 files allowed per broadcast");
      return;
    }

    // Validate files
    const validFiles = files.filter((file) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        safeToast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        safeToast.error(
          `${file.name} has invalid type. Only PDF, PPT, PPTX, and images are allowed.`,
        );
        return false;
      }

      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
    // Reset inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Remove file from selection
  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== index));
  };

  // Get file type for display
  const getFileType = (file) => {
    if (file.mimetype) return file.type; // For history files
    if (file.type === "application/pdf") return "pdf";
    if (file.type === "application/vnd.ms-powerpoint") return "ppt";
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
      return "pptx";
    if (file.type.startsWith("image/")) return "image";
    return "unknown";
  };

  // Detect URLs in the message
  const detectUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const detectedUrls = detectUrls(message);

  // Render message with clickable URLs
  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Session Announcements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Send messages, share links, and attach files with all students
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("send")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "send"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>History</span>
              {broadcastHistory.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                  {broadcastHistory.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "send" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Message Input with Markdown Support */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <div className="relative">
                  {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <MarkdownEditor
                    value={message}
                    onChange={setMessage}
                    maxLength={1000}
                    rows={6}
                    bottomLeftAdornment={
                      <div className="relative" ref={attachmentMenuRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setShowAttachmentMenu(!showAttachmentMenu)
                          }
                          disabled={selectedFiles.length >= 3}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            selectedFiles.length >= 3
                              ? "Maximum files reached"
                              : "Attach files"
                          }
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        </button>

                        {/* Attachment menu popup */}
                        {showAttachmentMenu && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[160px] z-20">
                            <button
                              type="button"
                              onClick={() => {
                                imageInputRef.current?.click();
                                setShowAttachmentMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Upload Images</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setShowAttachmentMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <span>Upload Files (PDF, PPT)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Selected Files Preview - Compact */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Attached Files ({selectedFiles.length}/3):
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <FilePreviewCard
                        key={idx}
                        file={{
                          originalName: file.name,
                          type: getFileType(file),
                          size: file.size,
                          url:
                            file instanceof File
                              ? URL.createObjectURL(file)
                              : file.url,
                        }}
                        onRemove={() => handleRemoveFile(idx)}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preview for detected URLs */}
              {detectedUrls.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        {detectedUrls.length}{" "}
                        {detectedUrls.length === 1 ? "Link" : "Links"} Detected
                      </p>
                      <div className="space-y-1">
                        {detectedUrls.map((url, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-blue-700 dark:text-blue-400 break-all font-mono"
                          >
                            {url}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  {sending ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to All Students</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // History Tab
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg
                    className="animate-spin w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              ) : broadcastHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No announcements yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Sent messages will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcastHistory.map((broadcast, index) => {
                    const hasUrls = broadcast.urls && broadcast.urls.length > 0;
                    return (
                      <div
                        key={broadcast._id || index}
                        className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`p-1.5 rounded-lg ${
                                hasUrls
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-gray-200 dark:bg-gray-600"
                              }`}
                            >
                              <svg
                                className={`w-4 h-4 ${
                                  hasUrls
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {hasUrls
                                ? `Message (${broadcast.urls.length} link${broadcast.urls.length > 1 ? "s" : ""})`
                                : "Message"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTimestamp(
                              broadcast.timestamp || broadcast.createdAt,
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                          {renderMessageWithLinks(broadcast.message)}
                        </div>

                        {/* Rich URL Preview Cards */}
                        {broadcast.urlMetadata &&
                          broadcast.urls &&
                          broadcast.urls.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {broadcast.urls.map((url, idx) => (
                                <URLPreviewCard
                                  key={idx}
                                  url={url}
                                  metadata={broadcast.urlMetadata[url]}
                                  compact={broadcast.urls.length > 2}
                                />
                              ))}
                            </div>
                          )}

                        {/* File Attachments */}
                        {broadcast.files && broadcast.files.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                              📎 {broadcast.files.length}{" "}
                              {broadcast.files.length === 1
                                ? "Attachment"
                                : "Attachments"}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {broadcast.files.map((file, idx) => (
                                <FilePreviewCard
                                  key={idx}
                                  file={file}
                                  compact={false}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reactions Section */}
                        {broadcast._id && broadcast.reactions && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                💬 Reactions (hover to see who reacted)
                              </p>
                            </div>
                            <ReactionPicker
                              broadcast={broadcast}
                              onReact={null}
                              currentUserId={currentUserId}
                              compact={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
