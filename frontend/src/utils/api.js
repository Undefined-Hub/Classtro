import axios from "axios";

const baseURL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach latest token dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to get absolute URL for backend resources
export const getBackendURL = (path) => {
  if (!path) return "";
  // If path is already absolute (starts with http, https, or blob), return as is
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
    return path;
  }
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseURL}/${cleanPath}`;
};

export default api;
