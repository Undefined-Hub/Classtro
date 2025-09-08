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

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  loginUser
);

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
