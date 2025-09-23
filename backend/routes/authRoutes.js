const { Router } = require("express");
const passport = require("passport");
const dotenv = require("dotenv");
const {
  loginUser,
  logoutUser,
  setRole,
  registerUser,
  googleAuthCallback,
  refreshToken,
  generateOTP,
  verifyEmail,
  resendOTP,
} = require("../controllers/authController.js");

const router = Router();
dotenv.config();

// Custom callback to surface proper error messages to the client
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return res
        .status(500)
        .json({ message: err.message || "Authentication error" });
    }
    if (!user) {
      // info may contain message from LocalStrategy
      return res
        .status(401)
        .json({ message: (info && info.message) || "Unauthorized" });
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
  passport.authenticate("google", { scope: ["profile", "email"],prompt: 'select_account' }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleAuthCallback,
);

// Handle OAuth failures
router.get("/google/failure", (req, res) => {
  const targetOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  
  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Authentication Failed</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; display: grid; place-items: center; height: 100vh; color: #111; }
        .box { text-align: center; }
        .error { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="box">
        <p class="error">Authentication failed. You can close this window.</p>
      </div>
      <script>
        (function() {
          try {
            var data = {
              type: 'OAUTH_ERROR',
              message: 'This account was registered via a different method. Please use the original login method.'
            };
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(data, ${JSON.stringify(targetOrigin)});
            }
          } catch (e) {
            console.error('Failed to deliver error message:', e);
          } finally {
            setTimeout(function(){ window.close(); }, 2000);
          }
        })();
      </script>
    </body>
  </html>`;

  res.status(200).send(html);
});

router.post("/refresh", refreshToken);

router.post("/set-role", setRole);

// ! OTP Routes
router.post("/generate-otp", generateOTP);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

module.exports = router;
