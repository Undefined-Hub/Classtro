const bcrypt = require("bcrypt");
const z = require("zod");
const dotenv = require("dotenv");
const User = require("../models/User");
const { validateInput } = require("../utils/validateInput");
const { generateToken, verifyToken } = require("../utils/jwtUtils");

// Load environment variables
dotenv.config();

// Zod schemas
const userRegisterSchema = z.object({
  name: z.string().min(3, "Name must contain at least 3 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  role: z.enum(
    ["Employee", "Manager"],
    "Role must be either 'Employee' or 'Manager'",
  ),
});

const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});

const loginUser = async (req, res) => {
  const user = req.user;

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
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password || !role) {
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
      role,
      authProvider: "LOCAL",
      status: "ACTIVE",
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully." });
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
