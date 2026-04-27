import axios from "axios";

const baseURL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  isRefreshing = false;
  failedQueue = [];
};

// Attach latest token dynamically in request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors that aren't already refreshing and not for login requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login")
    ) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using the refresh token in the HTTP-only cookie
        const refreshResponse = await axios.post(
          `${baseURL}/api/auth/refresh`,
          {},
          {
            withCredentials: true, // Include HTTP-only cookie
          },
        );

        const { accessToken } = refreshResponse.data;

        // Update the new token in localStorage
        localStorage.setItem("accessToken", accessToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests with new token
        processQueue(null, accessToken);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Process queued requests with error
        processQueue(refreshError, null);

        // Redirect to login if not already on the login, register, or home page
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/register") && path !== "/") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to get absolute URL for backend resources
export const getBackendURL = (path) => {
  if (!path) return "";
  // If path is already absolute (starts with http, https, or blob), return as is
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseURL}/${cleanPath}`;
};

export default api;
