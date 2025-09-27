import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";

export const STORAGE_KEY = "participantSession";

const ParticipantSessionContext = createContext(null);

export const ParticipantSessionProvider = ({ children }) => {
  const [pollId, setPollId] = useState(null);
  const [sessionData, setSessionData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  // const [activePoll, setActivePoll] = useState(null);
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [activePoll, setActivePoll] = useState(() => {
    try {
      const raw = sessionStorage.getItem("activePoll");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (sessionData) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [sessionData]);

  const clearSession = useCallback(() => {
    // remove persisted session and active poll immediately to avoid
    // consumers re-hydrating from storage and re-creating sockets.
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("activePoll");
    } catch {}

    setSessionData(null);
    setActivePoll(null);
  }, []);

  // Socket lifecycle - create once per provider when sessionData exists
  const SOCKET_URL = (import.meta.env?.VITE_BACKEND_BASE_URL || "http://localhost:3000") + "/sessions";
  useEffect(() => {
    // only create when we have session data and no socket
    if (!sessionData || socketRef.current) return;

    const token = localStorage.getItem("accessToken");
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    socketRef.current = socket;
    setSocketReady(true);

    // emit join on connect
    socket.on("connect", () => {
      try {
        socket.emit("join-session", {
          code: sessionData.joinCode,
          participantId: sessionData.participantId,
          role: "student",
        });
      } catch {}
    });

    // on unmount or when sessionData is cleared, leave and disconnect
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.emit("leave-session", {
            code: sessionData.joinCode,
            participantId: sessionData.participantId,
          });
        }
      } catch {}
      try {
        socket.disconnect();
      } catch {}
      socketRef.current = null;
      setSocketReady(false);
    };
    // we intentionally only want to run when sessionData becomes available or cleared
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  const value = useMemo(
    () => ({
      socketRef,
      socketReady,
      clearSession,

      sessionData,
      setSessionData,      

      activePoll,
      setActivePoll,
      
      broadcastMsg, 
      setBroadcastMsg,

      participantCount, 
      setParticipantCount,
      
      selectedOption, 
      setSelectedOption,

      pollSubmitting, 
      setPollSubmitting,

      pollSubmitted, 
      setPollSubmitted,

      pollId, 
      setPollId
    }),
    [sessionData, activePoll, socketReady]
  );

  return (
    <ParticipantSessionContext.Provider value={value}>
      {children}
    </ParticipantSessionContext.Provider>
  );
};

export const useParticipantSession = () => {
  const ctx = useContext(ParticipantSessionContext);
  if (!ctx)
    throw new Error(
      "useParticipantSession must be used within ParticipantSessionProvider"
    );
  return ctx;
};
