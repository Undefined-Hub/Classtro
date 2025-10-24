const { Router } = require("express");
const dotenv = require("dotenv");
const {
    updateUserProfile,
    changePassword,
    getUserProfile,
} = require("../controllers/userController.js");
const authenticateJWT = require("../middlewares/authenticateJWT.js");

const router = Router();
dotenv.config();

// Routes
router.get("/profile/:id", authenticateJWT, getUserProfile); // Get user profile
router.put("/profile/:id", authenticateJWT, updateUserProfile); // Update user profile (username, profile image)
router.put("/password/:id", authenticateJWT, changePassword); // Change password (separate route)

module.exports = router;