import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Keys for storage
const LS_TOKEN_KEY = "accessToken";
const LS_USER_KEY = "user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(LS_TOKEN_KEY);
      const storedUser = localStorage.getItem(LS_USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn("Failed to read auth from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userObj, accessToken) => {
    setUser(userObj);
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem(LS_TOKEN_KEY, accessToken);
    }
    localStorage.setItem(LS_USER_KEY, JSON.stringify(userObj));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAuthenticated: !!user }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
