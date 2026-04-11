import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import axios from "axios";

// Keys for storage
const LS_TOKEN_KEY = "accessToken";
const LS_USER_KEY = "user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const baseURL =
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";

  const clearLocalAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
  }, []);

  // Hydrate from localStorage and refresh token if needed
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(LS_TOKEN_KEY);
        const storedUser = localStorage.getItem(LS_USER_KEY);

        // If both token and user exist, restore them
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }

        // If no stored token but user exists, try to refresh
        if (storedUser && !storedToken) {
          try {
            // Try to refresh the token using the HTTP-only cookie
            const refreshResponse = await axios.post(
              `${baseURL}/api/auth/refresh`,
              {},
              {
                withCredentials: true, // Include HTTP-only cookie
              },
            );

            const { accessToken } = refreshResponse.data;
            localStorage.setItem(LS_TOKEN_KEY, accessToken);
            setToken(accessToken);
            setUser(JSON.parse(storedUser));
            setLoading(false);
            return;
          } catch (refreshError) {
            // Refresh failed, clear auth data
            console.warn("Token refresh failed on app load", refreshError);
            localStorage.removeItem(LS_TOKEN_KEY);
            localStorage.removeItem(LS_USER_KEY);
            setLoading(false);
            return;
          }
        }

        // No stored token or user, not authenticated
        setLoading(false);
      } catch (e) {
        console.warn("Failed to initialize auth", e);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback((userObj, accessToken) => {
    setUser(userObj);
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem(LS_TOKEN_KEY, accessToken);
    }
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userObj));
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${baseURL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );
    } catch (error) {
      // Best-effort logout: clear local auth even if backend call fails.
      console.warn("Backend logout failed, clearing local auth", error);
    } finally {
      clearLocalAuthState();
    }
  }, [baseURL, clearLocalAuthState]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAuthenticated: !!user }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
