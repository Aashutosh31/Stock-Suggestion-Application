import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import passport from 'passport';
import jwt from 'jsonwebtoken';

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
// --- ADD GOOGLE OAUTH ROUTES ---

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], // What we want from Google
    session: false 
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // 3. User is authenticated by passport! (available at req.user)
    // We create our own JWT.
    const payload = {
      user: {
        id: req.user.id,
        name: req.user.name,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        
        // 4. Redirect user back to the FRONTEND, passing the token in the URL
        // We also pass user data to save a network request
        const userQuery = encodeURIComponent(JSON.stringify(payload.user));
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userQuery}`);
      }
    );
  }
);

export default router;