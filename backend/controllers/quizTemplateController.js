const QuizTemplate = require("../models/QuizTemplate");
const mongoose = require("mongoose");

// * Create a new quiz template
const createQuizTemplate = async (req, res) => {
  try {
    const { title, description, questions, roomId } = req.body;

    // Process questions to map temporary optionIds to MongoDB ObjectIds
    const processedQuestions = questions.map((question) => {
      // Create a map of temporary optionId to MongoDB ObjectId
      const optionIdMap = {};
      
      // Generate MongoDB ObjectIds for each option
      const processedOptions = question.options.map((option) => {
        const mongoId = new mongoose.Types.ObjectId();
        
        // If user provided a temporary optionId, map it
        if (option.optionId) {
          optionIdMap[option.optionId] = mongoId;
        }
        
        return {
          _id: mongoId,
          text: option.text,
        };
      });

      // Map correctAnswers from temporary optionIds to MongoDB ObjectIds
      let processedCorrectAnswers = [];
      if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
        processedCorrectAnswers = question.correctAnswers.map((answerId) => {
          // If it's a temporary optionId, map it to MongoDB ObjectId
          if (optionIdMap[answerId]) {
            return optionIdMap[answerId];
          }
          // If it's already an ObjectId string, use it
          if (mongoose.Types.ObjectId.isValid(answerId)) {
            return answerId;
          }
          // If it's an index, use the option at that index
          const index = parseInt(answerId);
          if (!isNaN(index) && processedOptions[index]) {
            return processedOptions[index]._id;
          }
          
          throw new Error(`Invalid correctAnswer: ${answerId}`);
        });
      }

      return {
        type: question.type,
        questionText: question.questionText,
        options: processedOptions,
        correctAnswers: processedCorrectAnswers,
        points: question.points || 1,
        negativePoints: question.negativePoints || 0,
      };
    });

    // Calculate total points
    const totalPoints = processedQuestions.reduce(
      (sum, q) => sum + (q.points || 1),
      0
    );

    const template = await QuizTemplate.create({
      title,
      description,
      questions: processedQuestions,
      roomId,
      totalPoints,
      createdBy: req.user.id,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all quiz templates created by the logged-in user
const getQuizTemplates = async (req, res) => {
  try {
    const { roomId } = req.query;
    const filter = { createdBy: req.user.id };
    
    if (roomId) {
      filter.roomId = roomId;
    }

    // Build match stage with ObjectId casting
    const match = { createdBy: new mongoose.Types.ObjectId(req.user.id) };
    if (roomId) {
      match.roomId = new mongoose.Types.ObjectId(roomId);
    }

    const templates = await QuizTemplate.aggregate([
      { $match: match },
      { $addFields: { questionsCount: { $size: { $ifNull: ["$questions", []] } } } },
      { $project: { questions: 0, roomId: 0, createdBy: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
    
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single quiz template by ID
const getQuizTemplateById = async (req, res) => {
  try {
    const template = await QuizTemplate.findById(req.params.id)
      .populate("roomId", "name")
      .populate("createdBy", "name email");
    
    if (!template) {
      return res.status(404).json({ error: "Quiz template not found" });
    }

    // Check if user owns this template
    if (template.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a quiz template
const updateQuizTemplate = async (req, res) => {
  try {
    const template = await QuizTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: "Quiz template not found" });
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Process questions to handle both new and existing options
    let updateData = { ...req.body };
    
    if (req.body.questions) {
      const processedQuestions = req.body.questions.map((question) => {
        const optionIdMap = {};
        
        // Process options: keep existing MongoDB IDs, create new ones for temp IDs
        const processedOptions = question.options.map((option) => {
          // If option already has MongoDB ObjectId (from existing quiz), keep it
          if (option._id && mongoose.Types.ObjectId.isValid(option._id)) {
            return {
              _id: option._id,
              text: option.text,
            };
          }
          
          // For new options (with temp optionId), create a new MongoDB ObjectId
          const mongoId = new mongoose.Types.ObjectId();
          
          if (option.optionId) {
            optionIdMap[option.optionId] = mongoId;
          }
          
          return {
            _id: mongoId,
            text: option.text,
          };
        });

        // Map correctAnswers, handling all ID types
        let processedCorrectAnswers = [];
        if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
          processedCorrectAnswers = question.correctAnswers.map((answerId) => {
            // Handle mapped temporary IDs
            if (optionIdMap[answerId]) {
              return optionIdMap[answerId];
            }
            
            // Handle ObjectId strings (existing options)
            if (mongoose.Types.ObjectId.isValid(answerId)) {
              return answerId;
            }
            
            throw new Error(`Invalid correctAnswer: ${answerId}`);
          });
        }

        return {
          type: question.type,
          questionText: question.questionText,
          options: processedOptions,
          correctAnswers: processedCorrectAnswers,
          points: question.points || 1,
          negativePoints: question.negativePoints || 0,
        };
      });

      updateData.questions = processedQuestions;
      updateData.totalPoints = processedQuestions.reduce(
        (sum, q) => sum + (q.points || 1),
        0
      );
    }

    const updatedTemplate = await QuizTemplate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedTemplate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a quiz template
const deleteQuizTemplate = async (req, res) => {
  try {
    const template = await QuizTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: "Quiz template not found" });
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await QuizTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Quiz template deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createQuizTemplate,
  getQuizTemplates,
  getQuizTemplateById,
  updateQuizTemplate,
  deleteQuizTemplate,
};
