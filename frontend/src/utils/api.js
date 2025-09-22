import axios from "axios";

// * Base URL from environment variable or default to localhost
const baseURL = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

// * Get token from localStorage
const token = localStorage.getItem("accessToken");

// * Create axios instance
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  },
});

// * Export the api instance 
export default api;
