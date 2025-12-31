const Joi = require('joi');

// User validation schema
const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'CUSTOMER', 'staff', 'SELLER').optional(),
  phone: Joi.string().max(20).optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  password: Joi.string().min(6).optional()
});

// User update validation schema (all fields optional)
const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('admin', 'CUSTOMER', 'staff', 'SELLER').optional(),
  phone: Joi.string().max(20).optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  password: Joi.string().min(6).optional()
}).min(1); // At least one field must be provided

// Validation middleware for creating users
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }

  next();
};

// Validation middleware for updating users
const validateUserUpdate = (req, res, next) => {
  const { error } = userUpdateSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }

  next();
};

module.exports = {
  validateUser,
  validateUserUpdate
};