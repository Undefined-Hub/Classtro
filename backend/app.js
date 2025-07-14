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

io.on('connection', (socket) => {
  console.log("✅ New client connected");

  socket.on("join-room", ({ roomCode, studentName }) => {
    socket.join(roomCode);
    console.log(`${studentName} joined room ${roomCode}`);
    socket.to(roomCode).emit("student-joined", { studentName });
  });

  socket.on("teacher-join", ({ roomCode }) => {
    socket.join(roomCode);
    console.log(`Teacher joined room ${roomCode}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// ✅ Export the server instead of app
module.exports = { server };
