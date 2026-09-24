const { validationResult } = require('express-validator');

// Handle express-validator errors consistently
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      error: formattedErrors[0]?.message || 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = {
  handleValidationErrors
};
