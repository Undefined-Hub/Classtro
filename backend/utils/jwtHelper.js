const jwt = require('jsonwebtoken');

// Generate a JWT token
const generateToken = (payload, secret, options = { expiresIn: '1h' }) => {
    return jwt.sign(payload, secret, options);
};

// Verify a JWT token
const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = { generateToken, verifyToken };
