import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/userController.js';

const router = express.Router();

// @route   GET /api/user/watchlist
router.get('/watchlist', protect, getWatchlist);

// @route   POST /api/user/watchlist
router.post('/watchlist', protect, addToWatchlist);

// @route   DELETE /api/user/watchlist/:symbol
router.delete('/watchlist/:symbol', protect, removeFromWatchlist);

export default router;