import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom'; // <-- for reading ?room=xxx

const socket = io("http://localhost:5000");

function JoinSession() {
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const room = searchParams.get('room');
    if (room) {
      setRoomCode(room); // prefill from URL
    }
  }, [searchParams]);

  const handleJoin = () => {
    if (roomCode && name) {
      socket.emit("join-room", { roomCode, studentName: name });
      setJoined(true);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {!joined ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Join Session</h2>

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />

          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            onClick={handleJoin}
          >
            Join Session
          </button>
        </div>
      ) : (
        <div className="text-green-600 text-lg font-medium">
          ✅ You have joined the session!
        </div>
      )}
    </div>
  );
}

export default JoinSession;
