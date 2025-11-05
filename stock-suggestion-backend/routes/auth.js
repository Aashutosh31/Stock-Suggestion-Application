import express from 'express';
import { 
    registerUser, 
    loginUser, 
    updateProfile,
    forgotPassword,  // <-- Was missing
    resetPassword    // <-- Was missing
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser); 

// @route   PUT /api/auth/profile
// --- FIX: This route must be '/profile' to match the frontend call ---
router.put('/profile', protect, updateProfile);

// @route   GET /api/auth/verify
router.get('/verify', protect, (req, res) => {
    res.json({ user: req.user });
});

// --- ADDING THESE ROUTES ---
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);
// --- END ADD ---


// --- GOOGLE OAUTH ROUTES ---
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
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
        
        const userQuery = encodeURIComponent(JSON.stringify(payload.user));
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userQuery}`);
      }
    );
  }
);

export default router;