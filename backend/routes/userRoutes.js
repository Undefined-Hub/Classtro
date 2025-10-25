const { Router } = require("express");
const dotenv = require("dotenv");
const {
    updateUserProfile,
    changePassword,
    getUserProfile,
} = require("../controllers/userController.js");

const router = Router();
dotenv.config();

// Routes
router.get("/profile/:id", getUserProfile); // Get user profile
router.put("/profile/:id", updateUserProfile); // Update user profile (username, profile image)
router.put("/password/:id", changePassword); // Change password (separate route)

module.exports = router;