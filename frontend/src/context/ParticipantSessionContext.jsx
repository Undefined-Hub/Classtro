import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const STORAGE_KEY = 'participantSession';

const ParticipantSessionContext = createContext(null);

export const ParticipantSessionProvider = ({ children }) => {
  const [sessionData, setSessionData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
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

  const clearSession = () => setSessionData(null);

  const value = useMemo(() => ({ sessionData, setSessionData, clearSession }), [sessionData]);

  return (
    <ParticipantSessionContext.Provider value={value}>
      {children}
    </ParticipantSessionContext.Provider>
  );
};

export const useParticipantSession = () => {
  const ctx = useContext(ParticipantSessionContext);
  if (!ctx) throw new Error('useParticipantSession must be used within ParticipantSessionProvider');
  return ctx;
};
