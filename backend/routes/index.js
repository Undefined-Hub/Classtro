const { Router } = require("express");
const authRoutes = require("./authRoutes");
const utilRoutes = require("./utilRoutes");
const roomRoutes = require("./roomRoutes");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/util", authenticateJWT, utilRoutes);
router.use("/api/rooms", authenticateJWT, roomRoutes);

module.exports = router;