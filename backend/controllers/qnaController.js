const Question = require('../models/Question');
const QuestionUpvote = require('../models/QuestionUpvote');
const Session = require('../models/Session');
const { getSessionNamespace } = require('../socket');

// Helpers
function emitToSession(sessionCode, event, payload) {
  const ns = getSessionNamespace();
  if (!ns) return;
  ns.to(`session:${sessionCode}`).emit(event, payload);
}

// Create a question
const createQuestion = async (req, res) => {
  try {
    const { sessionId, text, isAnonymous } = req.body;
    const authorId = req.user?.id;
    console.log('createQuestion called', { sessionId, text, authorId });

    if (!sessionId || !text) {
      return res.status(400).json({ message: 'sessionId and text are required' });
    }

    // Verify session exists
    const session = await Session.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Create DB record (always store authorId + flag)
    const questionDoc = await Question.create({
      sessionId,
      authorId,
      text,
      isAnonymous
    });

    // Prepare response object
    let authorName = null;
    if (authorId && !isAnonymous) {
      const user = await require('../models/User')
        .findById(authorId, { name: 1 })
        .lean();
      authorName = user ? user.name : null;
    }

    // Shape the question object for frontend/socket
    const question = {
      
      _id: questionDoc._id,
      authorId: authorId,
      sessionId: questionDoc.sessionId,
      text: questionDoc.text,
      isAnonymous: questionDoc.isAnonymous,
      createdAt: questionDoc.createdAt,
      authorName: isAnonymous ? "Anonymous" : authorName
    };

    console.log("Created Question:", question);
    
    // Emit real-time event
    emitToSession(session.code, 'qna:question:created', { question });

    res.status(201).json({ question });
  } catch (err) {
    console.error('createQuestion error', err);
    res.status(500).json({ message: 'Failed to create question', error: err.message });
  }
};


// Edit question
const editQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    const q = await Question.findById(id);
    if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });
    if (String(q.authorId) !== String(userId)) return res.status(403).json({ message: 'Not allowed' });
    if (q.isAnswered) return res.status(400).json({ message: 'Cannot edit answered question' });

    q.text = text || q.text;
    await q.save();

    // Need session code
    const session = await Session.findById(q.sessionId).lean();
    emitToSession(session.code, 'qna:question:updated', { question: q });

    res.status(200).json({ question: q });
  } catch (err) {
    console.error('editQuestion error', err);
    res.status(500).json({ message: 'Failed to edit question', error: err.message });
  }
};

// Delete question (student can delete own if not answered; teacher can delete)
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const q = await Question.findById(id);
    if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });

    const isAuthor = String(q.authorId) === String(userId);
    const isTeacher = userRole === 'TEACHER' || userRole === 'ADMIN';

    if (!isAuthor && !isTeacher) return res.status(403).json({ message: 'Not allowed' });
    if (q.isAnswered && isAuthor) return res.status(400).json({ message: 'Cannot delete answered question' });

    q.isDeleted = true;
    await q.save();

    const session = await Session.findById(q.sessionId).lean();
    emitToSession(session.code, 'qna:question:deleted', { questionId: q._id });

    res.status(200).json({ message: 'Question deleted' });
  } catch (err) {
    console.error('deleteQuestion error', err);
    res.status(500).json({ message: 'Failed to delete question', error: err.message });
  }
};

// Upvote toggling behaviour: if insert fails due duplicate key -> remove upvote
const upvoteQuestion = async (req, res) => {
  try {
    const { id } = req.params; // question id
    const participantId = req.user?.id;
    const userRole = req.user?.role;

    // Teachers and admins should not upvote questions
    if (userRole === 'TEACHER' || userRole === 'ADMIN') {
      return res.status(403).json({ message: 'Teachers cannot upvote questions' });
    }

    const q = await Question.findById(id);
    if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });

    // Try to create upvote
    try {
      await QuestionUpvote.create({ questionId: id, participantId });
      // increment counter
      await Question.findByIdAndUpdate(id, { $inc: { upvotes: 1 } }, { new: true });
      const session = await Session.findById(q.sessionId).lean();
      emitToSession(session.code, 'qna:question:upvoted', { questionId: id, delta: 1 });
      return res.status(200).json({ message: 'Upvoted' });
    } catch (err) {
      // Duplicate -> remove upvote (toggle off)
      if (err.code === 11000) {
        await QuestionUpvote.deleteOne({ questionId: id, participantId });
        await Question.findByIdAndUpdate(id, { $inc: { upvotes: -1 } }, { new: true });
        const session = await Session.findById(q.sessionId).lean();
        emitToSession(session.code, 'qna:question:upvoted', { questionId: id, delta: -1 });
        return res.status(200).json({ message: 'Upvote removed' });
      }
      throw err;
    }
  } catch (err) {
    console.error('upvoteQuestion error', err);
    res.status(500).json({ message: 'Failed to upvote question', error: err.message });
  }
};

// Mark answered (teacher only)
const markAnswered = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    if (!(userRole === 'TEACHER' || userRole === 'ADMIN')) return res.status(403).json({ message: 'Not allowed' });

    const q = await Question.findById(id);
    if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });

    q.isAnswered = true;
    await q.save();

    const session = await Session.findById(q.sessionId).lean();
    emitToSession(session.code, 'qna:question:answered', { questionId: id });

    res.status(200).json({ message: 'Question marked as answered' });
  } catch (err) {
    console.error('markAnswered error', err);
    res.status(500).json({ message: 'Failed to mark answered', error: err.message });
  }
};

// Get questions for a session
const getQuestionsBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { includeDeleted = 'false' } = req.query;

    const filters = { sessionId };
    if (includeDeleted !== 'true') filters.isDeleted = false;

    // Sort by upvotes desc then createdAt desc
    const questions = await Question.find(filters).sort({ upvotes: -1, createdAt: -1 }).lean();

    const userIds = questions.map(q => q.authorId).filter(Boolean);
    const users = await require('../models/User').find({ _id: { $in: userIds } }, { name: 1 }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });
    questions.forEach(q => {
      q.authorName = q.authorId ? userMap[q.authorId.toString()] || null : null;
    });
    console.log("Fetched Questions from getQuestionsFromSession:", questions);
    res.status(200).json({ questions});
  } catch (err) {
    console.error('getQuestionsBySession error', err);
    res.status(500).json({ message: 'Failed to load questions', error: err.message });
  }
};

module.exports = {
  createQuestion,
  editQuestion,
  deleteQuestion,
  upvoteQuestion,
  markAnswered,
  getQuestionsBySession,
};
