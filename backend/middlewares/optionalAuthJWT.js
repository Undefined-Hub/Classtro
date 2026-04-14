const passport = require("passport");

// Optional JWT authentication - allows both authenticated and guest users
const optionalAuthJWT = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    // If user exists (token is valid), attach to request
    if (user) {
      req.user = user;
    }
    // If no user (no token or invalid token), continue without user
    // req.user will be undefined for guest users

    next();
  })(req, res, next);
};

module.exports = optionalAuthJWT;
