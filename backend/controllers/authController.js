const bcrypt = require("bcrypt");
const z = require("zod");
const dotenv = require("dotenv");
const User = require("../models/User");
const { validateInput } = require("../utils/validateInput");
const { generateToken, verifyToken } = require("../utils/jwtUtils");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");

// Load environment variables
dotenv.config();

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ! Find user and check password
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ! Check if user completed registration process
    if (!user.emailVerified) {
      // ! Regenerate and send new OTP
      const otpResult = await otpService.generateAndSendOTP(email, user.name);
      return res.status(403).json({ 
        message: "Email not verified. Please check your email for verification code.",
        requiresVerification: true,
        step: 1, // ! Email verification step
        emailSent: otpResult.success,
        expiresIn: otpResult.expiresIn
      });
    }

    if (user.role === "UNKNOWN") {
      return res.status(403).json({ 
        message: "Please complete your profile by selecting a role.",
        requiresVerification: true,
        step: 2, // ! Role selection step
        email: user.email
      });
    }

    // ! Existing login logic
    const payload = { user: { id: user.id } };
    const accessToken = generateToken(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = generateToken(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    user.refreshToken = refreshToken;
    await user.save();
    user.password = undefined;
    user.__v = undefined;
    user.updatedAt = undefined;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
};

const logoutUser = async (req, res, next) => {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Optionally, remove refresh token from user in DB
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshToken = "";
        await user.save();
      }
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role: "UNKNOWN", // ? will be updated after email verification
      authProvider: "LOCAL",
      status: "ACTIVE",
      emailVerified: false, // Add this field
    });
    await newUser.save();

    // Generate and send OTP for email verification
    const otpResult = await otpService.generateAndSendOTP(email, name);
    
    if (otpResult.success) {
      res.status(201).json({ 
        message: "User registered successfully. Please check your email for verification code.",
        emailSent: true,
        expiresIn: otpResult.expiresIn
      });
    } else {
      // User was created but email failed - still return success but warn about email
      res.status(201).json({ 
        message: "User registered successfully, but email verification could not be sent. Please try again.",
        emailSent: false,
        emailError: otpResult.message
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed.", error: err.message });
  }
};

const googleAuthCallback = async (req, res) => {
  // Generate access token
  const payload = { user: { id: req.user.id } };
  const accessToken = generateToken(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // Generate refresh token
  const refreshToken = generateToken(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  req.user.refreshToken = refreshToken;
  await req.user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  // Instead of redirecting the popup, send a tiny HTML bridge that
  // postMessages the result to the opener (main window) and then closes itself.
  // This enables the main window to decide where to navigate next.
  const safeUser = {
    id: req.user.id,
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  };

  const payloadForOpener = {
    type: "OAUTH_SUCCESS",
    accessToken,
    user: safeUser,
    isNewUser: req.user.isNewUser || false, // Include isNewUser flag
  };

  const targetOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173"; // Frontend origin

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Signing you in...</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; display: grid; place-items: center; height: 100vh; color: #111; }
        .box { text-align: center; }
      </style>
    </head>
    <body>
      <div class="box">
        <p>Successfully authenticated. You can close this window.</p>
      </div>
      <script>
        (function() {
          try {
            var data = ${JSON.stringify(payloadForOpener)};
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(data, ${JSON.stringify(targetOrigin)});
            }
          } catch (e) {
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'OAUTH_ERROR', message: 'Failed to deliver token' }, '*');
              }
            } catch (_) {}
          } finally {
            // Allow a brief moment for the message to be delivered before closing
            setTimeout(function(){ window.close(); }, 300);
          }
        })();
      </script>
    </body>
  </html>`;

  res.status(200).send(html);
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies; // Get from HTTP-only cookie
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.user.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateToken(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Invalid or expired refresh token", error });
    // next(error);
  }
};

const setRole = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ message: "Role updated successfully.", role });
  } catch (error) {
    next(error);
  }
};

// ! OTP Generation for Email Verification
const generateOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await otpService.generateAndSendOTP(email);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in generateOTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ! OTP Verification
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = await otpService.verifyOTP(email, otp);

    if (result.success) {
      // Mark email as verified in database
      await User.findOneAndUpdate(
        { email },
        { emailVerified: true }
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ! Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await otpService.resendOTP(email);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in resendOTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  setRole,
  googleAuthCallback,
  refreshToken,
  generateOTP,
  verifyEmail,
  resendOTP,
};
