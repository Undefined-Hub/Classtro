import React, { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { io } from "socket.io-client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

const socket = io("http://localhost:5000");

function Dashboard() {
  const [roomCode, setRoomCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [students, setStudents] = useState([]);

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollResults, setPollResults] = useState(null);

  const handleCreateSession = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/session/create");
      setRoomCode(res.data.roomCode);
      setSessionId(res.data.sessionId);
      socket.emit("teacher-join", { roomCode: res.data.roomCode });
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const launchPoll = () => {
    const poll = {
      question: pollQuestion,
      options: pollOptions.filter(opt => opt.trim() !== ""),
    };
    socket.emit("launch-poll", { roomCode, poll });
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const endPoll = () => {
    socket.emit("end-poll", { roomCode });
    setPollResults(null);
  };

  useEffect(() => {
    socket.on("student-joined", ({ studentName }) => {
      setStudents(prev => [...prev, studentName]);
    });

    socket.on("poll-update", (responses) => {
      const chartData = Object.entries(responses).map(([option, count]) => ({
        option,
        count,
      }));
      setPollResults(chartData);
    });

    socket.on("poll-ended", () => {
      setPollResults(null);
    });

    return () => {
      socket.off("student-joined");
      socket.off("poll-update");
      socket.off("poll-ended");
    };
  }, []);

  return (
    <div className="p-6">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleCreateSession}
      >
        Create Session
      </button>

      {roomCode && (
        <div className="mt-6">
          <p className="text-lg font-semibold">Room Code: {roomCode}</p>
          <div className="mt-4">
            <QRCode
              value={`http://localhost:5173/join?room=${roomCode}`}
              size={128}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">👥 Students Joined:</h3>
            {students.length > 0 ? (
              <ul className="list-disc ml-5">
                {students.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No students yet.</p>
            )}
          </div>

          {/* --- Poll Form --- */}
          <div className="mt-10">
            <h2 className="text-lg font-bold">📊 Launch Poll</h2>
            <input
              className="border px-3 py-2 w-full my-2"
              placeholder="Poll Question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                className="border px-3 py-2 w-full my-1"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOptions = [...pollOptions];
                  newOptions[idx] = e.target.value;
                  setPollOptions(newOptions);
                }}
              />
            ))}
            <button
              className="bg-green-600 text-white px-4 py-2 mt-2 rounded"
              onClick={launchPoll}
            >
              Launch Poll
            </button>
            {pollResults && (
              <button
                className="ml-4 bg-red-600 text-white px-4 py-2 mt-2 rounded"
                onClick={endPoll}
              >
                End Poll
              </button>
            )}
          </div>

          {/* --- Live Results --- */}
          {pollResults && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">📈 Live Results:</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pollResults} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="option" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb">
                    <LabelList dataKey="count" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
