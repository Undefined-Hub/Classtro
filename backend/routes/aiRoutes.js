const express = require('express');
const {
  handleChatRequest,
  handleInsightsRequest,
  handleSessionComparisonRequest,
  handleFeatureHelpRequest,
  handleHealthCheck,
} = require('../controllers/aiController');
const authenticateJWT = require('../middlewares/authenticateJWT');

const router = express.Router();

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health status
 * @access  Public
 */
router.get('/health', handleHealthCheck);

/**
 * @route   POST /api/ai/chat
 * @desc    Process chatbot conversation
 * @access  Private (authenticated users - teachers and students)
 * @body    { message, role, page?, knowledge? }
 */
router.post('/chat', authenticateJWT, handleChatRequest);

/**
 * @route   POST /api/ai/feature-help
 * @desc    Get help for a specific platform feature
 * @access  Private (authenticated users)
 * @body    { featureName, role }
 */
router.post('/feature-help', authenticateJWT, handleFeatureHelpRequest);

/**
 * @route   POST /api/ai/insights
 * @desc    Generate AI insights for a session
 * @access  Private (teachers only)
 * @body    { sessionData, focusArea? }
 * @note    Requires teacher role - add role check middleware if needed
 */
router.post('/insights', authenticateJWT, handleInsightsRequest);

/**
 * @route   POST /api/ai/compare-sessions
 * @desc    Compare multiple sessions and generate insights
 * @access  Private (teachers only)
 * @body    { sessions[], comparisonType? }
 * @note    Requires teacher role - add role check middleware if needed
 */
router.post('/compare-sessions', authenticateJWT, handleSessionComparisonRequest);

module.exports = router;
