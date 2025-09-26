const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const router = require("./routes");
require("./config/Passport");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// 🧠 Connect to Database
connectDB();

// 🔧 Middleware
// const allowedOrigins = [
//   "http://localhost:5173",
//   process.env.CLIENT_ORIGIN,
// ].filter(Boolean);

// Define your base domains
const allowedBaseDomains = [
  "classtro.live",
  "www.classtro.live",
  "classtro.vercel.app",
  "classtro-dev.vercel.app",
  "localhost",
];


// Function to check if origin is allowed
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow requests like Postman / server-to-server

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // ✅ Check against fixed allowed domains
    if (allowedBaseDomains.includes(hostname)) return true;

    // ✅ Allow any preview subdomain ending with vercel.app
    if (hostname.endsWith("vercel.app")) {
      // Optionally tighten this rule to only your project:
      if (hostname.includes("classtro") || hostname.includes("classtro-dev")) {
        return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
};



app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use(errorHandler);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(router);

app.get("/", (req, res) => {
  res.send("Welcome to the Classtro API");
});

app.get("/test-error", (req, res, next) => {
  const error = new Error("This is a test error!");
  error.status = 400;
  next(error);
});

// ✅ Export the server instead of app
module.exports = { server };
