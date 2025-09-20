const { Router } = require("express");
const passport = require("passport");
const dotenv = require("dotenv");
const {
  loginUser,
  logoutUser,
  registerUser,
  googleAuthCallback,
  refreshToken,
} = require("../controllers/authController.js");

const router = Router();
dotenv.config();

// Custom callback to surface proper error messages to the client
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: err.message || "Authentication error" });
    }
    if (!user) {
      // info may contain message from LocalStrategy
      return res.status(401).json({ message: (info && info.message) || "Unauthorized" });
    }
    // Attach user to req and proceed to controller
    req.user = user;
    return loginUser(req, res, next);
  })(req, res, next);
});

router.post("/logout", logoutUser);

router.post("/register", registerUser);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/failure",
  }),
  googleAuthCallback
);

router.post("/refresh", refreshToken);

module.exports = router;
