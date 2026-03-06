// --- POLL CLOSE ---

// In-memory vote tracking
const voteMap = {}; // { [pollId]: { [participantId]: optionIndex } }
const pollCounts = {}; // { [pollId]: [count, count, ...] }

const { Server } = require("socket.io");
const { registerQuizSocket } = require("./socket/quizSocket");
const jwt = require("jsonwebtoken");

let ioInstance = null;
const Poll = require("./models/Polls");

// Socket authentication middleware
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      socket.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("❌ JWT verification failed:", err.message);
        socket.user = null;
        return next();
      }
      
      // JWT payload is { user: { id: ... } }
      socket.user = {
        id: decoded.user?.id || decoded.id,
        email: decoded.user?.email || decoded.email,
        name: decoded.user?.name || decoded.name,
      };
      console.log("✅ Socket authenticated for user:", socket.user.id);
      next();
    });
  } catch (error) {
    socket.user = null;
    next();
  }
};

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  ioInstance = io;

  const sessionNamespace = io.of("/sessions");
  
  // Apply authentication middleware to the namespace
  sessionNamespace.use(authenticateSocket);

  function emitRoomUpdate(namespace, code) {
    const roomName = `session:${code}`;
    const socketsInRoom = Array.from(
      namespace.adapter.rooms.get(roomName) || [],
    );
    const count = socketsInRoom.length;

    console.log(`Room ${roomName} members:`, socketsInRoom);
    console.log("Latest Room members count:", count);

    namespace.to(roomName).emit("room:members", { sockets: socketsInRoom });
    namespace.to(roomName).emit("participants:update", { code, count });
  }

  sessionNamespace.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    
    // Register quiz socket handlers
    registerQuizSocket(sessionNamespace, socket);
    
    socket.on("poll:close", ({ code, pollId }) => {
      // Optionally: mark poll as closed in DB here
      sessionNamespace.to(`session:${code}`).emit("poll:closed", { pollId });
    });
    // --- POLL VOTING (in-memory) ---
    socket.on(
      "poll:vote",
      async ({ code, pollId, participantId, optionIndex }) => {
        // Initialize maps if needed
        if (!voteMap[pollId]) voteMap[pollId] = {};
        if (!pollCounts[pollId]) pollCounts[pollId] = [];

        const prev = voteMap[pollId][participantId];
        if (prev !== undefined && pollCounts[pollId][prev] > 0)
          pollCounts[pollId][prev]--;
        pollCounts[pollId][optionIndex] =
          (pollCounts[pollId][optionIndex] || 0) + 1;
        voteMap[pollId][participantId] = optionIndex;
        console.log(
          `🗳️ Vote recorded: Poll ${pollId}, Participant ${participantId}, Option ${optionIndex}`,
        );

        // Update MongoDB poll option votes to match in-memory counts
        try {
          const poll = await Poll.findById(pollId);
          if (poll && poll.options && poll.options.length > optionIndex) {
            // Update all option vote counts to match in-memory
            poll.options.forEach((opt, idx) => {
              opt.votes = pollCounts[pollId][idx] || 0;
            });
            await poll.save();
          }
        } catch (err) {
          console.error("Failed to update poll votes in DB:", err);
        }

        // broadcast updated counts
        sessionNamespace
          .to(`session:${code}`)
          .emit("poll:update", { pollId, counts: pollCounts[pollId] });
      },
    );

    // --- JOIN SESSION ---
    socket.on("join-session", ({ code, participantId }) => {
      socket.join(`session:${code}`);
      console.log(`👤 Participant ${participantId} joined session ${code}`);
      emitRoomUpdate(sessionNamespace, code);
    });

    // --- LEAVE SESSION ---
    socket.on("leave-session", ({ code, participantId }) => {
      socket.leave(`session:${code}`);
      console.log(`👤 Participant ${participantId} left session ${code}`);
      setImmediate(() => emitRoomUpdate(sessionNamespace, code));
    });

    // --- TEACHER BROADCAST MESSAGE ---
    socket.on("broadcast:teacher", ({ code, message, urls = [], urlMetadata = null, files = [], teacherId, broadcastId }) => {
      console.log(
        `📢 Teacher ${teacherId} broadcast in session ${code}: ${message}`,
      );

      // Send message to all in this session (students + teacher if connected)
      sessionNamespace.to(`session:${code}`).emit("broadcast:message", {
        from: "teacher",
        message,
        urls,
        urlMetadata,
        files,
        code,
        broadcastId,
        timestamp: new Date(),
      });
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomName) => {
        if (roomName.startsWith("session:")) {
          const code = roomName.split(":")[1];
          setImmediate(() => emitRoomUpdate(sessionNamespace, code));
        }
      });
    });

    // --- SESSION END ---
    socket.on("session:end", ({ code }, callback) => {
      console.log(`⏹️ Session ${code} end request received from ${socket.id}`);

      try {
        // Emit to all participants that session has ended
        sessionNamespace.to(`session:${code}`).emit("session:ended");
        console.log(
          `📢 Session ended notification sent to all participants in ${code}`,
        );

        // Remove all sockets from the session room
        sessionNamespace.in(`session:${code}`).socketsLeave(`session:${code}`);
        console.log(`🧹 All sockets removed from session:${code}`);

        // Send acknowledgment to confirm successful processing
        if (callback && typeof callback === "function") {
          callback({ success: true, message: "Session ended successfully" });
          console.log(`✅ Acknowledgment sent for session ${code}`);
        }

        console.log(`⏹️ Session ${code} cleanup completed successfully`);
      } catch (error) {
        console.error(`❌ Error ending session ${code}:`, error);

        // Send error acknowledgment
        if (callback && typeof callback === "function") {
          callback({ success: false, error: error.message });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });

    // --- BROADCAST REACTIONS ---
    socket.on("broadcast:reaction", ({ code, broadcastId, emoji, userId, userName, action }) => {
      console.log(
        `${action === "added" ? "👍" : "🚫"} User ${userName} ${action} reaction ${emoji} to broadcast ${broadcastId}`
      );
      console.log(`[SOCKET:reaction] Emitting to room: session:${code}`);

      // Notify all participants in the session about the reaction update
      sessionNamespace.to(`session:${code}`).emit("broadcast:reaction-update", {
        broadcastId,
        emoji,
        userId,
        userName,
        action, // "added" or "removed"
        timestamp: new Date(),
      });
    });

    socket.on("poll:create", async ({ code, poll }) => {
      sessionNamespace.to(`session:${code}`).emit("polls:new-poll", poll);
    });

    // socket.on("polls:vote", async ({code, pollId, optionId }) => {
    //   try {
    //     console.log("Processing vote for pollId:", pollId, "optionId:", optionId);
    //     const poll = await Poll.findById(pollId);
    //     if (!poll) {
    //       console.error("Poll not found:", pollId);
    //       return;
    //     }
    //     console.log("Found poll:", poll);
    //     const option = poll.options.id(optionId);
    //     console.log("Voting on option:", option);
    //     if (!option) {
    //       console.error("Option not found:", optionId);
    //       return;
    //     }
    //     option.votes += 1;
    //     await poll.save();
    //     sessionNamespace
    //       .to(`session:${code}`)
    //       .emit("polls:update", poll);
    //   } catch (error) {
    //     console.error("Error processing vote:", error);
    //   }
    // });
  });

  return io;
}

function getSessionNamespace() {
  if (!ioInstance) return null;
  return ioInstance.of("/sessions");
}

function getIOInstance() {
  return ioInstance;
}

module.exports = { setupSockets, getSessionNamespace, getIOInstance };
