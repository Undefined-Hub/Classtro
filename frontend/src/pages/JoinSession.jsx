import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

const socket = io("http://localhost:5000");

function JoinSession() {
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  // Poll related
  const [activePoll, setActivePoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    const room = searchParams.get('room');
    if (room) setRoomCode(room);
  }, [searchParams]);

  const handleJoin = () => {
    if (roomCode && name) {
      socket.emit("join-room", { roomCode, studentName: name });
      setJoined(true);
    }
  };

  useEffect(() => {
    socket.on("new-poll", (poll) => {
      setActivePoll(poll);
      setSelectedOption("");
    });

    socket.on("poll-ended", () => {
      setActivePoll(null);
      setSelectedOption("");
    });

    return () => {
      socket.off("new-poll");
      socket.off("poll-ended");
    };
  }, []);

  const handlePollResponse = (option) => {
    setSelectedOption(option);
    socket.emit("submit-poll-response", {
      roomCode,
      studentName: name,
      selectedOption: option
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {!joined ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">🎓 Join a Session</h2>

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
        <div>
          <div className="bg-green-100 border border-green-300 text-green-800 rounded p-4 mb-6">
            <h2 className="text-xl font-semibold">👋 Welcome, {name}!</h2>
            <p className="mt-1">You've successfully joined room <strong>{roomCode}</strong>.</p>
          </div>

          {activePoll ? (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">📊 {activePoll.question}</h3>
              {activePoll.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`block w-full my-2 border px-4 py-2 rounded text-left transition ${
                    selectedOption === opt
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => handlePollResponse(opt)}
                >
                  {opt}
                </button>
              ))}
              {selectedOption && (
                <div className="text-blue-600 mt-3">
                  ✅ You selected: <strong>{selectedOption}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 mt-6 italic">
              No active poll currently. Please wait for the teacher to launch one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JoinSession;
