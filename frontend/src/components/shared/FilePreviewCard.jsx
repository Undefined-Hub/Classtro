import React from "react";
import { getBackendURL } from "../../utils/api";

/**
 * FilePreviewCard - Display file attachments with download capability
 */
const FilePreviewCard = ({ file, onRemove, compact = false }) => {
  const { originalName, type, size, url } = file;

  // Get absolute URL for the file
  const absoluteURL = url ? getBackendURL(url) : "";

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on type
  const getFileIcon = () => {
    switch (type) {
      case "pdf":
        return (
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 18h12V6h-4V2H4v16zm-2 1V1a1 1 0 011-1h8.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a1 1 0 01-1 1H3a1 1 0 01-1-1z"/>
            <text x="10" y="14" fontSize="8" textAnchor="middle" fill="currentColor" fontWeight="bold">PDF</text>
          </svg>
        );
      case "ppt":
      case "pptx":
        return (
          <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 18h12V6h-4V2H4v16zm-2 1V1a1 1 0 011-1h8.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a1 1 0 01-1 1H3a1 1 0 01-1-1z"/>
            <text x="10" y="14" fontSize="7" textAnchor="middle" fill="currentColor" fontWeight="bold">PPT</text>
          </svg>
        );
      case "image":
        return absoluteURL ? (
          <img
            src={absoluteURL}
            alt={originalName}
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
        ) : (
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const fileIcon = getFileIcon();
  const isImage = type === "image";

  if (compact) {
    // Compact mode - for compose view or multiple files
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-2 flex items-center space-x-3 group hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
        <div className="flex-shrink-0">{fileIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {originalName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {type.toUpperCase()} • {formatFileSize(size)}
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Remove file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {!onRemove && absoluteURL && (
          <a
            href={absoluteURL}
            target="_blank"
            rel="noopener noreferrer"
            download={originalName}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Download file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        )}
      </div>
    );
  }

  // Full card mode - for broadcast feed
  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {isImage && absoluteURL ? (
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800">
          <img
            src={absoluteURL}
            alt={originalName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800">
          {fileIcon}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
              {originalName}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="uppercase font-semibold">{type}</span>
              <span>•</span>
              <span>{formatFileSize(size)}</span>
            </div>
          </div>
        </div>
        {absoluteURL && (
          <a
            href={absoluteURL}
            target="_blank"
            rel="noopener noreferrer"
            download={originalName}
            className="mt-2 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        )}
      </div>
    </div>
  );
};

export default FilePreviewCard;
