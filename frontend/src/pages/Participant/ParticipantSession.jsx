import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useParticipantSession } from '../../context/ParticipantSessionContext.jsx';
import { STORAGE_KEY } from '../../context/ParticipantSessionContext.jsx';
import SessionClock from '../../components/Participant/SessionClock.jsx';

const SOCKET_URL = (import.meta.env?.VITE_BACKEND_BASE_URL || 'http://localhost:5000') + '/sessions';

const ParticipantSession = () => {
  const navigate = useNavigate();
  const { sessionData, setSessionData, clearSession } = useParticipantSession();

  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const socketRef = useRef(null);


  // If no session in context (e.g., on fast route change), attempt hydrate from storage before redirect
  useEffect(() => {
    if (!sessionData) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSessionData(parsed);
          return;
        }
      } catch {}
      navigate('/participant/home');
    }
  }, [sessionData, setSessionData, navigate]);

  // Removed per-second clock re-render; SessionClock handles its own interval

  // Initialize socket on mount and join session room
  useEffect(() => {
    if (!sessionData || socketRef.current) return;

    const token = localStorage.getItem('accessToken');
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Participant] connected:', socket.id);
      socket.emit('join-session', {
        code: sessionData.joinCode,
        participantId: sessionData.participantId,
        role: 'student',
      });
    });

    const onBroadcast = (data) => {
      setBroadcastMsg(`${data.message}${data.from ? ` (from ${data.from})` : ''}`);
      console.log('[Participant] broadcast:message', data);
    };
    const onRoomMembers = (members) => {
      console.log('[Participant] room:members', members);
    };
    
    const onParticipantsUpdate = (data) => {
      console.log('[Participant] participants:update', data);
      if (data.code === sessionData.joinCode) {
        setParticipantCount(data.count);
      }
    };
    
    const onSessionEnded = (payload) => {
      console.log('[Participant] session:ended', payload);
      alert('Session has ended by the host. You will be redirected.');
      clearSession();
      navigate('/participant/home');
    };

    socket.on('broadcast:message', onBroadcast);
    socket.on('room:members', onRoomMembers);
    socket.on('participants:update', onParticipantsUpdate);
    socket.on('session:ended', onSessionEnded);

    return () => {
      try {
        socket.emit('leave-session', {
          code: sessionData.joinCode,
          participantId: sessionData.participantId,
        });
      } catch {}
      socket.off('broadcast:message', onBroadcast);
      socket.off('room:members', onRoomMembers);
      socket.off('participants:update', onParticipantsUpdate);
      socket.off('session:ended', onSessionEnded);
      socket.disconnect();
      socketRef.current = null;
      clearSession();
    };
  }, [sessionData, clearSession, navigate]);

  // Time formatting handled in SessionClock (hh:mm)

  const handleLeaveSession = async () => {
    if (!sessionData) return;
    try {
      // Call backend API to update DB
      const baseURL = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('accessToken');
      await fetch(`${baseURL}/api/sessions/code/${sessionData.joinCode}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ participantId: sessionData.participantId }),
      });
      // After DB update, emit socket event
      const socket = socketRef.current;
      if (socket) {
        socket.emit('leave-session', { code: sessionData.joinCode, participantId: sessionData.participantId });
      }
      clearSession();
      navigate('/participant/home');
    } catch (err) {
      alert('Failed to leave session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Live Session</span>
              </div>
              <SessionClock className="text-sm text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.session?.title || 'Session'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Code: {sessionData?.joinCode|| 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Host: {sessionData?.session?.teacherId?.name || 'Unknown'}
                </p>
              </div>
              
              <button
                onClick={handleLeaveSession}
                className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-8">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            You're All Set!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Successfully joined the session
          </p>
          
          {/* Participant count badge */}
          <div className="mt-6 inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Host name for mobile */}
          <div className="sm:hidden mt-2 text-sm text-gray-500 dark:text-gray-400">
            Host: {sessionData?.session?.teacherId?.name || 'Unknown'}
          </div>

          {/* Session Info Card - Kept as commented per request */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Session Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.session?.title|| 'Unnamed Session'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Session Code:</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                  {sessionData?.joinCode || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Host:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionData?.session?.teacherId?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Participants:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {participantCount}
                </span>
              </div>
            </div>
          </div> */}

          {/* Waiting or Broadcast Message */}
          {!broadcastMsg ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-lg mx-auto mt-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                Waiting for Host
              </h3>
              <p className="text-blue-800 dark:text-blue-300">
                Please keep this window open
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-lg mx-auto mt-8 animate-fade-in">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Announcement from Host
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-lg">
                {broadcastMsg}
              </p>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Connected to session</span>
          </div>
        </div>
      </div>
    </div>
  );
};



export default ParticipantSession;