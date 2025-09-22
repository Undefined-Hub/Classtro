const mongoose = require("mongoose");
// ! Username isn't required if we use email as key field
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true }, // ? Optional for Google OAuth
    email: { type: String, unique: true, sparse: true }, // ? Optional for Google OAuth
    password: { type: String }, // ? Only for local strategy auth
    googleId: { type: String, unique: true, sparse: true }, // ? For Google OAuth users
    role: {
      type: String,
      enum: ["TEACHER", "STUDENT", "ADMIN", "UNKNOWN"],
      required: true,
    },
    profilePicture: { type: String, default: "" },

    authProvider: { type: String, enum: ["LOCAL", "GOOGLE"], required: true }, // ? Tracks auth type

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BANNED"],
      default: "ACTIVE",
    },

    refreshToken: {
      type: String,
      default: "",
    },

    // ! Email verification fields
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },

    // ! OTP fields
    otp: { type: Number },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
