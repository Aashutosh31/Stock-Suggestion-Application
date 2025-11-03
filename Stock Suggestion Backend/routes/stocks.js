import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getRealStockData } from '../controllers/stockController.js'; // The only controller we need

const router = express.Router();

// @route   GET /api/stocks/real/:symbol
// @desc    Get REAL proxied stock data from Alpha Vantage
// @access  Private (Requires JWT)
router.get('/real/:symbol', protect, getRealStockData);

//
// --- We have removed the old /data route and mockMonthlyData ---
// That code is now deleted as it has been replaced by the
// real data controller above.
//

export default router;