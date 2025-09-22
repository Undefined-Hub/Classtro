import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";
import api from "../utils/api";
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
  const [activeParticipantsCount, setActiveParticipantsCount] = useState(0);
  const socketRef = useRef(null);

  const calculateDuration = () => {
    const startTime = new Date(sessionData.startAt);
    const currentTime = new Date();
    const diffMs = currentTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleEndPoll = async () => {
    if (activePoll) {
      console.log("Active Poll is Ending", activePoll);

      // * Poll Object with End Parameters
      const endedPoll = {
        ...activePoll,
        isActive: false,
        endedAt: new Date().toISOString(),
      };

      // * Api call to patch and make the poll isActive false
      await api.patch(`/api/polls/${activePoll._id}`);

      // * Poll Close Socket Emit
      console.log("Ending poll:", activePoll.id);
      socketRef.current.emit("poll:close", {
        code: sessionData.code,
        pollId: activePoll._id,
      });

      // * Add to Past Polls and Clear Active Poll
      setPastPolls([endedPoll, ...pastPolls]);
      setActivePoll(null);
    }
  };

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
    setActiveParticipantsCount(0);
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

      activeParticipantsCount, 
      setActiveParticipantsCount,

      socketRef,
      resetHostSession,
      calculateDuration,
      handleEndPoll
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
