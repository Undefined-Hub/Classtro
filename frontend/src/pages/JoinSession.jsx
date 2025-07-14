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
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {!joined ? (
        <div>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="max-w-screen-xl mx-auto px-4 py-16">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Join a Session</h1>
                <p className="text-blue-100 text-lg">Connect with your classroom and participate in interactive learning</p>
              </div>
            </div>
          </div>

          {/* Join Form Section */}
          <div className="max-w-screen-xl mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Access</h2>
                  <p className="text-gray-600 dark:text-gray-400">Enter your details to join the session</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Code
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                    />
                  </div>

                  <button
                    className="w-full inline-flex items-center justify-center px-5 py-2.5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={handleJoin}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="max-w-screen-xl mx-auto px-4 py-12">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2">Welcome, {name}!</h1>
                <p className="text-green-100">You've successfully joined room <span className="font-semibold text-white bg-green-800 px-2 py-1 rounded">{roomCode}</span></p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            {activePoll ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <div className="text-center mb-8">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                      <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Active Poll</h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">{activePoll.question}</p>
                  </div>

                  <div className="space-y-3">
                    {activePoll.options.map((opt, idx) => (
                      <button
                        key={idx}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                          selectedOption === opt
                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => handlePollResponse(opt)}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                            selectedOption === opt
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {selectedOption === opt && (
                              <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">{opt}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedOption && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Your response has been recorded: <strong>{selectedOption}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                  <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Waiting for Activity</h3>
                  <p className="text-gray-500 dark:text-gray-400">No active poll currently. Please wait for the teacher to launch one.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JoinSession;
