const { Router } = require("express");
const authRoutes = require("./authRoutes");
const utilRoutes = require("./utilRoutes");
const authenticateJWT = require("../middlewares/authenticateJWT");

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/util", authenticateJWT, utilRoutes);

module.exports = router;