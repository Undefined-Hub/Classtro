const crypto = require("crypto");
const User = require("../models/User");
const emailService = require("./emailService");

class OTPService {
  constructor() {
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  }

  generateOTP() {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateExpiryTime() {
    const now = new Date();
    return new Date(now.getTime() + this.otpExpiryMinutes * 60 * 1000);
  }

  async generateAndSendOTP(email, userName = null) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Generate OTP and expiry
      const otp = this.generateOTP();
      const otpExpiry = this.generateExpiryTime();

      // Store OTP in user document
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpCreatedAt = new Date(); // Track when OTP was created
      user.otpAttempts = 0; // Reset attempts
      await user.save();

      // Send OTP email
      const emailResult = await emailService.sendOTP(
        email,
        otp,
        userName || user.name,
      );

      if (emailResult.success) {
        console.log(`OTP sent to ${email}: ${otp}`); // Remove in production
        return {
          success: true,
          message: "OTP sent successfully",
          expiresIn: this.otpExpiryMinutes,
        };
      } else {
        return {
          success: false,
          message: "Failed to send OTP email",
          error: emailResult.error,
        };
      }
    } catch (error) {
      console.error("Error generating and sending OTP:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error.message,
      };
    }
  }

  async verifyOTP(email, providedOTP) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check if OTP exists
      if (!user.otp || !user.otpExpiry) {
        return {
          success: false,
          message: "No OTP found. Please request a new one.",
        };
      }

      // Check if OTP has expired
      if (new Date() > user.otpExpiry) {
        // Clear expired OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpCreatedAt = undefined;
        user.otpAttempts = 0;
        await user.save();

        return {
          success: false,
          message: "OTP has expired. Please request a new one.",
        };
      }

      // Check attempt limit (prevent brute force)
      const maxAttempts = 5;
      if (user.otpAttempts >= maxAttempts) {
        // Clear OTP after too many attempts
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpCreatedAt = undefined;
        user.otpAttempts = 0;
        await user.save();

        return {
          success: false,
          message: "Too many invalid attempts. Please request a new OTP.",
        };
      }

      // Verify OTP
      if (parseInt(providedOTP) === user.otp) {
        // OTP is correct - clear it and mark user as verified
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpCreatedAt = undefined;
        user.otpAttempts = 0;
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        await user.save();

        return {
          success: true,
          message: "OTP verified successfully",
        };
      } else {
        // Increment attempt counter
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        await user.save();

        const remainingAttempts = maxAttempts - user.otpAttempts;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        };
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error.message,
      };
    }
  }

  async resendOTP(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check if enough time has passed since last OTP (prevent spam)
      const minResendIntervalSeconds = 60; // 60 seconds = 1 minute

      if (user.otpCreatedAt) {
        const timeSinceLastOtpSeconds = (new Date() - user.otpCreatedAt) / 1000; // in seconds

        console.log(
          `Time since last OTP: ${timeSinceLastOtpSeconds} seconds, minimum required: ${minResendIntervalSeconds} seconds`,
        );

        if (timeSinceLastOtpSeconds < minResendIntervalSeconds) {
          const waitTime = Math.ceil(
            minResendIntervalSeconds - timeSinceLastOtpSeconds,
          );
          return {
            success: false,
            message: `Please wait ${waitTime} more seconds before requesting a new OTP.`,
          };
        }
      }

      // Generate and send new OTP
      return await this.generateAndSendOTP(email, user.name);
    } catch (error) {
      console.error("Error resending OTP:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error.message,
      };
    }
  }

  async clearOTP(email) {
    try {
      const user = await User.findOne({ email });
      if (user) {
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpCreatedAt = undefined;
        user.otpAttempts = 0;
        await user.save();
      }
      return { success: true };
    } catch (error) {
      console.error("Error clearing OTP:", error);
      return { success: false, error: error.message };
    }
  }

  // Utility method to clean up expired OTPs (can be run as a cron job)
  async cleanupExpiredOTPs() {
    try {
      const result = await User.updateMany(
        {
          otpExpiry: { $lt: new Date() },
          otp: { $exists: true },
        },
        {
          $unset: {
            otp: 1,
            otpExpiry: 1,
            otpCreatedAt: 1,
            otpAttempts: 1,
          },
        },
      );

      console.log(`Cleaned up ${result.modifiedCount} expired OTPs`);
      return result.modifiedCount;
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
      return 0;
    }
  }
}

module.exports = new OTPService();
