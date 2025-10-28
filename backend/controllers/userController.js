const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const { validateInput } = require("../utils/validateInput");
const { updateUserProfileSchema, changePasswordSchema, userIdParamSchema } = require("../schemas/userSchemas");

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID parameter
    validateInput(userIdParamSchema, { id });
    
    // Find user by ID and exclude sensitive fields
    const user = await User.findById(id).select('-password -refreshToken -otp -otpExpiry -otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update user profile (username and profile picture)
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID parameter
    validateInput(userIdParamSchema, { id });
    
    // Validate request body
    const validatedData = validateInput(updateUserProfileSchema, req.body);
    
    // Check if at least one field is provided
    if (!validatedData.name && !validatedData.username && !validatedData.profilePicture) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name, username, or profilePicture) is required"
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (validatedData.name) {
      updateData.name = validatedData.name.trim();
    }

    if (validatedData.username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username: validatedData.username.trim(), 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken"
        });
      }
      
      updateData.username = validatedData.username.trim();
    }

    if (validatedData.profilePicture) {
      updateData.profilePicture = validatedData.profilePicture.trim();
    }

    // Update user
    updateData.updatedAt = new Date();
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password -refreshToken -otp -otpExpiry -otpAttempts');

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} is already taken`
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Change password (separate from profile update)
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID parameter
    validateInput(userIdParamSchema, { id });
    
    // Validate request body
    const validatedData = validateInput(changePasswordSchema, req.body);
    
    // Check if new password and confirm password match
    if (validatedData.newPassword !== validatedData.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has a password (for local auth users)
    if (!user.password || user.authProvider !== 'LOCAL') {
      return res.status(400).json({
        success: false,
        message: "Password change not available for this account type"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
};
