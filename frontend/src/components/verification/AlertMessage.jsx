import React from "react";

const AlertMessage = ({ type = "info", message, className = "" }) => {
  const getAlertStyles = () => {
    const baseStyles =
      "flex items-center justify-center rounded-lg border px-4 py-3 shadow-sm";

    switch (type) {
      case "error":
        return `${baseStyles} border-red-200 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200`;
      case "success":
        return `${baseStyles} border-green-200 bg-green-50 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200`;
      case "warning":
        return `${baseStyles} border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200`;
      default:
        return `${baseStyles} border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <svg
            className="w-5 h-5 mr-2 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
            />
          </svg>
        );
      case "success":
        return (
          <svg
            className="w-5 h-5 mr-2 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5 mr-2 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 mr-2 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (!message) return null;

  return (
    <div className={`mt-4 ${getAlertStyles()} ${className}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

export default AlertMessage;
