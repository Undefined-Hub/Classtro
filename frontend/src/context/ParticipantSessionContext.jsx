import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

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

  const clearSession = () => {
    setSessionData(null);
    setActivePoll(null);
  };

  const value = useMemo(
    () => ({
      socketRef,
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
    [sessionData, activePoll]
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
