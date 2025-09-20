import toast from "react-hot-toast";

// Simple toast wrapper that safely handles errors and prevents spamming
const recentToasts = new Set();

const safeToast = {
  success: (message, options = {}) => {
    try {
      return toast.success(message, options);
    } catch (e) {
      console.warn("Toast error:", e);
    }
  },

  error: (message, options = {}) => {
    try {
      // Prevent spam of identical error messages
      const key = `error:${message}`;
      if (recentToasts.has(key)) return;

      recentToasts.add(key);
      setTimeout(() => recentToasts.delete(key), 3000);

      return toast.error(message, options);
    } catch (e) {
      console.warn("Toast error:", e);
    }
  },

  loading: (message = "Loading...", options = {}) => {
    try {
      return toast.loading(message, options);
    } catch (e) {
      console.warn("Toast error:", e);
      return null;
    }
  },

  dismiss: (toastId) => {
    try {
      if (toastId) {
        toast.dismiss(toastId);
      }
    } catch (e) {
      console.warn("Toast dismiss error:", e);
    }
  },
};

export default safeToast;
