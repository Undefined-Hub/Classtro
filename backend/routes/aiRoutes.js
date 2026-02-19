const express = require('express');
const {
  handleChatRequest,
  handleInsightsRequest,
  handleHealthCheck,
} = require('../controllers/aiController');
const authenticateJWT = require('../middlewares/authenticateJWT');
const optionalAuthJWT = require('../middlewares/optionalAuthJWT');

const router = express.Router();

router.get('/health', handleHealthCheck);
router.post('/chat', optionalAuthJWT, handleChatRequest); // Allow both authenticated and guest users
router.post('/insights', authenticateJWT, handleInsightsRequest); // Requires authentication

module.exports = router;