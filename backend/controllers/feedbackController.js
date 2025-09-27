const Feedback = require("../models/Feedback");
const { feedbackValidationSchema, updateStatusSchema, querySchema } = require('../schemas/feedbackSchemas');
const { validateInput } = require('../utils/validateInput');

// Create a new feedback/bug report
const createFeedback = async (req, res) => {
    try {
      // Log incoming request for debugging
      console.log('=== FULL REQUEST BODY DEBUG ===');
      console.log('req.body:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file);
      console.log('================================');
      
      console.log('Received feedback submission:', {
        type: req.body.type,
        title: req.body.title?.substring(0, 50),
        hasDescription: !!req.body.description,
        userEmail: req.body.userEmail
      });

      // Parse metadata if it's a JSON string
      let parsedBody = { ...req.body };
      if (req.body.metadata && typeof req.body.metadata === 'string') {
        try {
          parsedBody.metadata = JSON.parse(req.body.metadata);
        } catch (error) {
          console.log('Failed to parse metadata JSON:', error);
          parsedBody.metadata = {};
        }
      }

      // Validate input using Zod schema
      const validatedData = validateInput(feedbackValidationSchema, parsedBody);

      // Create feedback record
      const feedbackData = {
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        stepsToReproduce: validatedData.stepsToReproduce || null,
        severity: validatedData.severity || (validatedData.type === 'bug' ? 'medium' : null),
        userEmail: validatedData.userEmail || null,
        screenshot: req.file ? `/uploads/screenshots/${req.file.filename}` : null,
        metadata: {
          userAgent: validatedData.metadata?.userAgent || '',
          appVersion: validatedData.metadata?.appVersion || '1.0.0',
          viewport: validatedData.metadata?.viewport || '',
          url: validatedData.metadata?.url || '',
          timestamp: validatedData.metadata?.timestamp || new Date().toISOString(),
          console: Array.isArray(validatedData.metadata?.console) ? validatedData.metadata.console.slice(0, 10) : []
        },
        status: 'new',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || ''
      };

    //   console.log('📝 About to create feedback with data:', feedbackData);
      
      const feedback = await Feedback.create(feedbackData);
      
    //   console.log('✅ Feedback created successfully in database!');
    //   console.log('📊 Database collection name:', Feedback.collection.name);
    //   console.log('🆔 Created document ID:', feedback._id);

      // Log the feedback creation
      console.log(`New ${validatedData.type} created:`, {
        id: feedback._id,
        title: feedback.title,
        severity: feedback.severity,
        userEmail: feedback.userEmail,
        url: feedback.metadata.url
      });

      // Return success response
      res.status(201).json({
        id: feedback._id,
        status: 'created',
        message: `${validatedData.type === 'bug' ? 'Bug report' : 'Feedback'} submitted successfully`,
        reportNumber: feedback._id.toString().slice(-8).toUpperCase()
      });

    } catch (error) {
      console.error('Error creating feedback:', error);
      
      // Handle Zod validation errors
      if (error.message === 'Validation Error' && error.details) {
        console.log('Validation errors:', error.details);
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'A similar report already exists',
          code: 'DUPLICATE_REPORT'
        });
      }

      // Handle validation errors from MongoDB
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Invalid data provided',
          details: Object.values(error.errors).map(err => err.message),
          code: 'DATABASE_VALIDATION_ERROR'
        });
      }

      // Generic server error
      res.status(500).json({
        error: 'Failed to submit report. Please try again later.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
};

// Get all feedback/reports with pagination and filtering
const getAllFeedback = async (req, res) => {
    try {
      // Validate query parameters
      const validation = validateInput(querySchema, req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.errors,
          code: 'QUERY_VALIDATION_ERROR'
        });
      }

      const { page, limit, type, status, severity } = validation.data;

      // Build query
      const query = {};
      if (type) query.type = type;
      if (status) query.status = status;
      if (severity) query.severity = severity;

      // Execute query with pagination
      const feedback = await Feedback.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await Feedback.countDocuments(query);

      res.json({
        feedback,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        error: 'Failed to fetch feedback',
        code: 'FETCH_ERROR'
      });
    }
};

// Get a specific feedback by ID
const getFeedbackById = async (req, res) => {
    try {
      const feedback = await Feedback.findById(req.params.id);
      
      if (!feedback) {
        return res.status(404).json({
          error: 'Feedback not found',
          code: 'FEEDBACK_NOT_FOUND'
        });
      }

      res.json(feedback);

    } catch (error) {
      console.error('Error fetching feedback:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          error: 'Invalid feedback ID',
          code: 'INVALID_ID'
        });
      }

      res.status(500).json({
        error: 'Failed to fetch feedback',
        code: 'FETCH_ERROR'
      });
    }
};

// Update feedback status (for admin use)
const updateFeedbackStatus = async (req, res) => {
    try {
      // Validate request body
      const validation = validateInput(updateStatusSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid status update data',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const { status } = validation.data;

      const feedback = await Feedback.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!feedback) {
        return res.status(404).json({
          error: 'Feedback not found',
          code: 'FEEDBACK_NOT_FOUND'
        });
      }

      res.json({
        message: 'Feedback status updated successfully',
        feedback
      });

    } catch (error) {
      console.error('Error updating feedback status:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          error: 'Invalid feedback ID',
          code: 'INVALID_ID'
        });
      }

      res.status(500).json({
        error: 'Failed to update feedback status',
        code: 'UPDATE_ERROR'
      });
    }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
    try {
      const totalFeedback = await Feedback.countDocuments();
      const bugs = await Feedback.countDocuments({ type: 'bug' });
      const feedback = await Feedback.countDocuments({ type: 'feedback' });
      const newFeedback = await Feedback.countDocuments({ status: 'new' });
      const inProgress = await Feedback.countDocuments({ status: 'in-progress' });
      const resolved = await Feedback.countDocuments({ status: 'resolved' });
      const criticalBugs = await Feedback.countDocuments({ type: 'bug', severity: 'critical' });

      const stats = {
        totalFeedback,
        bugs,
        feedback,
        newFeedback,
        inProgress,
        resolved,
        criticalBugs
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        code: 'STATS_ERROR'
      });
    }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getFeedbackStats
};