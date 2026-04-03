const bcrypt = require("bcrypt");
const z = require("zod");
const dotenv = require("dotenv");
const User = require("../models/User");
const { validateInput } = require("../utils/validateInput");
const { generateToken, verifyToken } = require("../utils/jwtUtils");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");

emailService.verifyConnection().then((ok) => {
  if (!ok) console.error("SMTP connection failed on startup!");
});
// Load environment variables
dotenv.config();

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email, " Password: ", password);
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
        message:
          "Email not verified. Please check your email for verification code.",
        requiresVerification: true,
        step: 1, // ! Email verification step
        emailSent: otpResult.success,
        expiresIn: otpResult.expiresIn,
      });
    }

    if (user.role === "UNKNOWN") {
      return res.status(403).json({
        message: "Please complete your profile by selecting a role.",
        requiresVerification: true,
        step: 2, // ! Role selection step
        email: user.email,
      });
    }

    // ! Existing login logic
    const payload = { user: { id: user.id } };
    const accessToken = generateToken(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = generateToken(
      payload,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );

    user.refreshToken = refreshToken;
    await user.save();
    user.password = undefined;
    user.__v = undefined;
    user.updatedAt = undefined;

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: safeUser,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Server error. Please try again later.",
        error: err.message,
      });
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
        message:
          "User registered successfully. Please check your email for verification code.",
        emailSent: true,
        expiresIn: otpResult.expiresIn,
      });
    } else {
      // User was created but email failed - still return success but warn about email
      res.status(201).json({
        message:
          "User registered successfully, but email verification could not be sent. Please try again.",
        emailSent: false,
        emailError: otpResult.message,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed.", error: err.message });
  }
};

const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user; // This comes from Passport after successful authentication

    if (!user) {
      // Handle authentication failure
      return res.redirect(
        `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/auth/callback?error=authentication_failed`,
      );
    }

    // Generate access token
    const payload = { user: { id: user.id } };
    const accessToken = generateToken(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Generate refresh token
    const refreshToken = generateToken(
      payload,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );

    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Prepare user data
    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    // Redirect to frontend callback with auth data
    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const callbackUrl = new URL("/auth/callback", clientOrigin);
    callbackUrl.searchParams.set("success", "true");
    callbackUrl.searchParams.set("accessToken", accessToken);
    callbackUrl.searchParams.set("user", JSON.stringify(safeUser));
    callbackUrl.searchParams.set("isNewUser", user.isNewUser || false);

    res.redirect(callbackUrl.toString());
    } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/auth/callback?error=internal_error`);
  }
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
      await User.findOneAndUpdate({ email }, { emailVerified: true });

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
