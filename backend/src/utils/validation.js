const Joi = require('joi');

// User registration schema
const userRegistrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  healthConditions: Joi.array()
    .items(Joi.string().valid(
      'Hypertension',
      'Type 2 Diabetes',
      'Type 1 Diabetes',
      'COPD',
      'Asthma',
      'Heart Disease',
      'Chronic Kidney Disease',
      'Arthritis',
      'Depression',
      'Anxiety',
      'Other'
    ))
    .max(5)
    .default([])
    .messages({
      'array.max': 'You can select up to 5 health conditions',
      'any.only': 'Please select valid health conditions'
    })
});

// User login schema
const userLoginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Vitals logging schema
const vitalsLogSchema = Joi.object({
  date: Joi.date()
    .iso()
    .max('now')
    .default(new Date())
    .messages({
      'date.max': 'Date cannot be in the future',
      'date.iso': 'Please provide a valid date'
    }),
  bloodPressureSystolic: Joi.number()
    .integer()
    .min(70)
    .max(300)
    .allow('')
    .messages({
      'number.base': 'Systolic blood pressure must be a number',
      'number.integer': 'Systolic blood pressure must be a whole number',
      'number.min': 'Systolic blood pressure must be at least 70 mmHg',
      'number.max': 'Systolic blood pressure cannot exceed 300 mmHg'
    }),
  bloodPressureDiastolic: Joi.number()
    .integer()
    .min(40)
    .max(200)
    .allow('')
    .messages({
      'number.base': 'Diastolic blood pressure must be a number',
      'number.integer': 'Diastolic blood pressure must be a whole number',
      'number.min': 'Diastolic blood pressure must be at least 40 mmHg',
      'number.max': 'Diastolic blood pressure cannot exceed 200 mmHg'
    }),
  heartRate: Joi.number()
    .integer()
    .min(30)
    .max(220)
    .allow('')
    .messages({
      'number.base': 'Heart rate must be a number',
      'number.integer': 'Heart rate must be a whole number',
      'number.min': 'Heart rate must be at least 30 bpm',
      'number.max': 'Heart rate cannot exceed 220 bpm'
    }),
  weight: Joi.number()
    .precision(1)
    .min(50)
    .max(1000)
    .allow('')
    .messages({
      'number.base': 'Weight must be a number',
      'number.min': 'Weight must be at least 50 lbs',
      'number.max': 'Weight cannot exceed 1000 lbs'
    }),
  temperature: Joi.number()
    .precision(1)
    .min(90)
    .max(115)
    .allow('')
    .messages({
      'number.base': 'Temperature must be a number',
      'number.min': 'Temperature must be at least 90°F',
      'number.max': 'Temperature cannot exceed 115°F'
    }),
  mood: Joi.string()
    .valid('great', 'good', 'okay', 'stressed', 'tired', 'unwell')
    .allow('')
    .messages({
      'any.only': 'Please select a valid mood option'
    }),
  notes: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
}).custom((value, helpers) => {
  // Validate that at least one vital sign is provided
  const vitals = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'weight', 'temperature'];
  const hasVital = vitals.some(vital => value[vital] !== '' && value[vital] !== undefined && value[vital] !== null);
  
  if (!hasVital && (!value.mood || value.mood === '')) {
    return helpers.error('vitals.required');
  }
  
  // Validate blood pressure consistency
  const hasSystolic = value.bloodPressureSystolic && value.bloodPressureSystolic !== '';
  const hasDiastolic = value.bloodPressureDiastolic && value.bloodPressureDiastolic !== '';
  
  if (hasSystolic && !hasDiastolic) {
    return helpers.error('vitals.bloodPressureIncomplete', { message: 'Please provide both systolic and diastolic blood pressure' });
  }
  
  if (hasDiastolic && !hasSystolic) {
    return helpers.error('vitals.bloodPressureIncomplete', { message: 'Please provide both systolic and diastolic blood pressure' });
  }
  
  if (hasSystolic && hasDiastolic && value.bloodPressureSystolic <= value.bloodPressureDiastolic) {
    return helpers.error('vitals.bloodPressureInvalid', { message: 'Systolic pressure must be higher than diastolic pressure' });
  }
  
  return value;
}, 'vitals validation').messages({
  'vitals.required': 'Please provide at least one vital sign or mood entry',
  'vitals.bloodPressureIncomplete': 'Please provide both systolic and diastolic blood pressure',
  'vitals.bloodPressureInvalid': 'Systolic pressure must be higher than diastolic pressure'
});

// Dashboard query parameters schema
const dashboardQuerySchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.integer': 'Days must be a whole number',
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 365'
    })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Query validation middleware factory
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  vitalsLogSchema,
  dashboardQuerySchema,
  validate,
  validateQuery
};
