import React, { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Dashboard() {
  const [roomCode, setRoomCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [students, setStudents] = useState([]);

  const handleCreateSession = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/session/create");
      setRoomCode(res.data.roomCode);
      setSessionId(res.data.sessionId);

      // Join the socket room as teacher
      socket.emit("teacher-join", { roomCode: res.data.roomCode });
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  useEffect(() => {
    // Listen for students joining
    socket.on("student-joined", ({ studentName }) => {
      setStudents((prev) => [...prev, studentName]);
    });

    return () => {
      socket.off("student-joined");
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
        </div>
      )}
    </div>
  );
}

export default Dashboard;
