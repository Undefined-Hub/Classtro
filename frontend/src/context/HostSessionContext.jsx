import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";

/**
 * HostSessionContext provides all state and actions for the host's session workspace.
 * Use useHostSession() in any child component to access or update session state.
 */
const HostSessionContext = createContext(null);

export const HostSessionProvider = ({ children }) => {
  const [sessionData, setSessionData] = useState({});
  const [activeView, setActiveView] = useState("main");
  const [participantsList, setParticipantsList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [pastPolls, setPastPolls] = useState([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const socketRef = useRef(null);

  const resetHostSession = () => {
    setSessionData({});
    setActiveView("main");
    setParticipantsList([]);
    setQuestions([]);
    setActivePoll(null);
    setPastPolls([]);
    setShowPollForm(false);
    setShowConfirmClose(false);
    setBroadcastMessage("");
    setBroadcastStatus("");
    setShowBroadcastForm(false);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const value = useMemo(
    () => ({
      sessionData,
      setSessionData,
      activeView,
      setActiveView,
      participantsList,
      setParticipantsList,
      questions,
      setQuestions,
      activePoll,
      setActivePoll,
      pastPolls,
      setPastPolls,
      showPollForm,
      setShowPollForm,
      showConfirmClose,
      setShowConfirmClose,
      broadcastMessage,
      setBroadcastMessage,
      broadcastStatus,
      setBroadcastStatus,
      showBroadcastForm,
      setShowBroadcastForm,
      socketRef,
      resetHostSession,
    }),
    [
      sessionData,
      activeView,
      participantsList,
      questions,
      activePoll,
      pastPolls,
      showPollForm,
      showConfirmClose,
      broadcastMessage,
      broadcastStatus,
      showBroadcastForm,
    ],
  );

  return (
    <HostSessionContext.Provider value={value}>
      {children}
    </HostSessionContext.Provider>
  );
};

/**
 * useHostSession - React hook to access host session context
 */
export const useHostSession = () => {
  const ctx = useContext(HostSessionContext);
  if (!ctx)
    throw new Error("useHostSession must be used within a HostSessionProvider");
  return ctx;
};
