
import React, { useEffect, useState } from 'react';
import SessionList from './SessionList';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:2000";

const RoomDetail = ({ room, onBack, onCreateSession, onSessionClick }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token from localStorage (or useAuth if available)
  let token = null;
  try {
    token = localStorage.getItem('accessToken');
  } catch (e) {
    token = null;
  }

  useEffect(() => {
    if (!room?._id) return;
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/rooms/${room._id}/sessions`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : (data.sessions || []));
      } catch (err) {
        setError(err.message || 'Error fetching sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [room?._id, token]);

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{room.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{room.description}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Max: {room.defaultMaxStudents} students
            </div>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created: {new Date(room.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <SessionList
        sessions={sessions}
        loading={loading}
        error={error}
        onSessionClick={onSessionClick}
        onCreateSession={onCreateSession}
      />
    </div>
  );
};

export default RoomDetail;
