console.log("Hello from errorHandler.js");

const errorHandler = (err, req, res, next) => {
  // Determine the status code
  const statusCode =
    res.statusCode === 200 ? err.status || 500 : res.statusCode;

  res.status(statusCode);

  // Construct the error response
  const errorResponse = {
    message: err.message || "Internal Server Error",
    // Include validation details if available
    ...(err.details && { details: err.details }),
    // Include stack trace only in development mode
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  };

  res.json(errorResponse);
};

module.exports = { errorHandler };
