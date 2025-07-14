const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/session');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);

// 🧠 Connect to Database
connectDB();

// 🔧 Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 📦 Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Classtro API');
});

app.get('/test-error', (req, res, next) => {
  const error = new Error('This is a test error!');
  error.status = 400;
  next(error);
});

// 🛠 Error Handling Middleware
app.use(errorHandler);

// 🔌 Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// 🧠 Maintain poll state per room
const activePolls = {}; // { roomCode: { question, options: [], responses: { A: 2, B: 3 }, voters: { socketId: "A" } } }

io.on('connection', (socket) => {
  console.log("✅ New client connected");

  // Room Join
  socket.on("join-room", ({ roomCode, studentName }) => {
    socket.join(roomCode);
    console.log(`${studentName} joined room ${roomCode}`);
    socket.to(roomCode).emit("student-joined", { studentName });
  });

  socket.on("teacher-join", ({ roomCode }) => {
    socket.join(roomCode);
    console.log(`Teacher joined room ${roomCode}`);
  });

  // 🟢 Start a poll
  socket.on("launch-poll", ({ roomCode, poll }) => {
    // Initialize vote counts
    activePolls[roomCode] = {
      question: poll.question,
      options: poll.options,
      responses: poll.options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
      voters: {}
    };
    io.to(roomCode).emit("new-poll", activePolls[roomCode]);
  });

  // 🟡 Student votes
  socket.on("submit-poll-response", ({ roomCode, selectedOption }) => {
    const poll = activePolls[roomCode];
    if (!poll) return;

    const previousVote = poll.voters[socket.id];
    if (previousVote) {
      poll.responses[previousVote] -= 1; // Remove previous vote
    }

    poll.responses[selectedOption] += 1;
    poll.voters[socket.id] = selectedOption;

    io.to(roomCode).emit("poll-update", poll.responses);
  });

  // 🔴 End poll
  socket.on("end-poll", ({ roomCode }) => {
    delete activePolls[roomCode];
    io.to(roomCode).emit("poll-ended");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
    // Optional: remove vote from poll.voters if needed
  });
});



// ✅ Export the server instead of app
module.exports = { server };
