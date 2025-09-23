
const { Server } = require("socket.io");

let ioInstance = null;

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  ioInstance = io;

  const sessionNamespace = io.of("/sessions");

  sessionNamespace.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // --- JOIN SESSION ---
    socket.on("join-session", ({ code, participantId }) => {
      socket.join(`session:${code}`);
      console.log(`👤 Participant ${participantId} joined session ${code}`);

      // Debug: List all socket IDs in this session room
      const socketsInRoom = Array.from(
        sessionNamespace.adapter.rooms.get(`session:${code}`) || [],
      );
      console.log(`Room session:${code} members:`, socketsInRoom);
      // Emit to all in room
      sessionNamespace.to(`session:${code}`).emit("room:members", {
        sockets: socketsInRoom,
      });

      sessionNamespace.to(`session:${code}`).emit("participants:update", {
        code,
        count: sessionNamespace.adapter.rooms.get(`session:${code}`)?.size || 0,
      });
    });

    // --- LEAVE SESSION ---
    socket.on("leave-session", ({ code, participantId }) => {
      socket.leave(`session:${code}`);
      console.log(`👋 Participant ${participantId} left session ${code}`);

      sessionNamespace.to(`session:${code}`).emit("participants:update", {
        code,
        count: sessionNamespace.adapter.rooms.get(`session:${code}`)?.size || 0,
      });
    });

    // --- TEACHER BROADCAST MESSAGE ---
    socket.on("broadcast:teacher", ({ code, message, teacherId }) => {
      console.log(
        `📢 Teacher ${teacherId} broadcast in session ${code}: ${message}`,
      );

      // Send message to all in this session (students + teacher if connected)
      sessionNamespace.to(`session:${code}`).emit("broadcast:message", {
        from: "teacher",
        message,
        code,
        time: new Date(),
      });
    });

    // --- SESSION END ---
    socket.on("session:end", ({ code }) => {
      console.log(`⏹️ Session ${code} ended`);
      sessionNamespace.to(`session:${code}`).emit("session:ended");
      sessionNamespace.in(`session:${code}`).socketsLeave(`session:${code}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getSessionNamespace() {
  if (!ioInstance) return null;
  return ioInstance.of("/sessions");
}

module.exports = { setupSockets, getSessionNamespace };
