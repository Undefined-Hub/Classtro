// ! config/Passport.js
const dotenv = require("dotenv");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");
const User = require("../models/User.js");

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "super_secret_key",
};

// ? Local Strategy - Username & Password
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      console.log("Authenticating user: ", email);
      try {
        const user = await User.findOne({ email });
        console.log("Found user: ", user);

        if (!user) return done(null, false, { message: "User not found" });

        if (user.authProvider !== "LOCAL") {
          return done(null, false, {
            message: `This account was registered via ${user.authProvider}. Please login using that method.`,
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return done(null, false, { message: "Invalid password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ? Google Strategy - OAuth, code given by ChatGPT
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // ? First-time Google login → Create user
          user = await User.create({
            name: profile.displayName,
            googleId: profile.id,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            role: "STUDENT", // Or based on your logic
            authProvider: "GOOGLE",
            status: "ACTIVE",
          });
        }

        if (user.authProvider !== "GOOGLE") {
          return done(null, false, {
            message: `This account was registered via ${user.authProvider}. Please login using that method.`,
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ? JWT Strategy - Token based authentication
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.user.id).select("-password -__v -updatedAt");
      // console.log("User authenticated via JWT: ", payload);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);