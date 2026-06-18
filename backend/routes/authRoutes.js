const express = require('express');
const { register, login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const { body } = require('express-validator');
const { runValidation } = require('../middleware/validate');
const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('username').isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  runValidation,
  register
);

router.post(
  '/login',
  authLimiter,
  [body('username').notEmpty(), body('password').notEmpty()],
  runValidation,
  login
);

module.exports = router;
