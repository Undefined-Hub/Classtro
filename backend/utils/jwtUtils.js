const jwt = require("jsonwebtoken");
const generateToken = (user, secret, expiry) => {
  return jwt.sign(
    user,
    secret || "super_secret_key",
    expiry
  );
};

// ? Verify token manually, othwerwise passport-jwt strategy will handle it with passport.authenticate("jwt", ...)
const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = { generateToken, verifyToken };