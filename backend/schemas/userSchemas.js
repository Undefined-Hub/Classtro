const { z } = require("zod");

// Schema for updating user profile
const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must not exceed 50 characters").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must not exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  profilePicture: z.string().url("Profile picture must be a valid URL").optional(),
});

// Schema for changing password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100, "Password must not exceed 100 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
});

// Schema for validating user ID parameter
const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
});

module.exports = {
  updateUserProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
};