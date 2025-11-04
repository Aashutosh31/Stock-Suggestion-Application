import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser); 

// --- ADD THIS NEW ROUTE ---
// @route   GET /api/auth/verify
// @desc    Verify user token and return user data
// @access  Private
router.get('/verify', protect, (req, res) => {
    // If the 'protect' middleware passes, the token is valid.
    // The middleware attaches the user data (from the token) to req.user.
    // We can't get the name from the User model without an async DB call,
    // so let's modify the authController to add the name to the token.
    // For now, let's send back what we have.
    res.json({ user: req.user });
});
// -------------------------

export default router;