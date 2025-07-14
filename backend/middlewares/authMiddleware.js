const { verifyToken } = require('../utils/jwtHelper');

// Middleware to verify JWT token and check user role
const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        // Get token from Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // If no token, return 401 Unauthorized error
        if (!token) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        try {
            // Verify the token and attach user info to req.user
            const decoded = verifyToken(token, process.env.JWT_SECRET);
            req.user = decoded;  // Assuming payload contains user info (like _id)

            // Role-based access control
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            next();  // Proceed to the next middleware or route handler
        } catch (error) {
            // If the token is invalid or expired, return 401 Unauthorized error
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    };
};

module.exports = authMiddleware;
