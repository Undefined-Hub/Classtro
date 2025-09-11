const { Router } = require("express");
const authRoutes = require("./authRoutes");
const utilRoutes = require("./utilRoutes");
const roomRoutes = require("./roomRoutes");
const authenticateJWT = require("../middlewares/authenticateJWT");
const sessionRoutes = require("./sessionRoutes");

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/util", authenticateJWT, utilRoutes);
router.use("/api/rooms", authenticateJWT, roomRoutes); 
router.use("/api/sessions" , sessionRoutes); 

module.exports = router;