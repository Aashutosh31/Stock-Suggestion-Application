import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mock data structure simulating time series data (monthly trends)
// --- UPDATED MOCK DATA ---
const mockMonthlyData = [
    // date, Open, High, Low, Close, Volume, AI_Suggestion
    { date: 'Jan 2024', Open: 2400.50, High: 2500.00, Low: 2390.10, Close: 2450.75, Volume: 1200000, AI_Suggestion: 'Buy' },
    { date: 'Feb 2024', Open: 2460.00, High: 2600.20, Low: 2450.00, Close: 2580.90, Volume: 1500000, AI_Suggestion: 'Strong Buy' },
    { date: 'Mar 2024', Open: 2590.10, High: 2650.00, Low: 2580.50, Close: 2610.20, Volume: 1100000, AI_Suggestion: 'Hold' },
    { date: 'Apr 2024', Open: 2620.00, High: 2900.00, Low: 2615.00, Close: 2850.50, Volume: 1900000, AI_Suggestion: 'Strong Buy' },
    { date: 'May 2024', Open: 2850.00, High: 3050.00, Low: 2840.00, Close: 3020.10, Volume: 2200000, AI_Suggestion: 'Buy' },
    { date: 'Jun 2024', Open: 3025.00, High: 3030.00, Low: 2900.00, Close: 2950.45, Volume: 1800000, AI_Suggestion: 'Hold' },
    { date: 'Jul 2024', Open: 2960.00, High: 3150.00, Low: 2950.00, Close: 3105.60, Volume: 2500000, AI_Suggestion: 'Strong Buy' }, // Current Month
];
// -------------------------

// @route   GET /api/stocks/data
// @desc    Get mock stock data for charting and suggestions (Indian Stock Market)
// @access  Private (Requires JWT)
router.get('/data', protect, (req, res) => {
    // ... (rest of the route logic is fine)
    
    const latestData = mockMonthlyData[mockMonthlyData.length - 1];
    let risk_suggestion;
    if (latestData.Close > mockMonthlyData[mockMonthlyData.length - 2]?.Close) {
        risk_suggestion = 'Low Risk, Upward Trend';
    } else {
        risk_suggestion = 'Moderate Risk, Consolidation Expected';
    }

    res.json({
        symbol: 'RELIANCE', // Example Indian Stock
        name: 'Reliance Industries Ltd.',
        data: mockMonthlyData,
        ai_analysis: {
            latest_price: latestData.Close,
            suggestion: latestData.AI_Suggestion,
            risk_assessment: risk_suggestion,
            trend: 'Strong Uptrend since March 2024',
        }
    });
});

export default router;