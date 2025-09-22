const validateInput = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Map Zod error details into a more readable format
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join("."), // Join nested paths if any
      message: err.message,
    }));

    // Throw an error with a structured message
    const error = new Error("Validation Error");
    error.status = 400; // Bad Request
    error.details = errorDetails;
    throw error;
  }

  return result.data;
};

module.exports = { validateInput };
