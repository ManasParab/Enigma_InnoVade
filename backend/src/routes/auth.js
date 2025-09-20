const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { userRegistrationSchema } = require('../utils/validation');

// Public routes
router.post('/register', validate(userRegistrationSchema), authController.register);
router.get('/check-user', authController.checkUser);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/logout', verifyToken, authController.logout);
router.delete('/account', verifyToken, authController.deleteAccount);

module.exports = router;