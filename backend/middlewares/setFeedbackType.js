// Middleware to set feedback type based on route

const setFeedbackType = (req, res, next) => {
  req.body.type = "feedback";
  next();
};

const setBugType = (req, res, next) => {
  req.body.type = "bug";
  next();
};

module.exports = { setFeedbackType, setBugType };
