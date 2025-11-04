import User from '../models/User.js';
import Stock from '../models/Stock.js';

// @desc    Get user's watchlist
// @route   GET /api/user/watchlist
// @access  Private
export const getWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('watchlist');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Fetch full stock details for the symbols in the watchlist
        const watchlistStocks = await Stock.find({
            symbol: { $in: user.watchlist }
        });

        res.json(watchlistStocks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a stock to the watchlist
// @route   POST /api/user/watchlist
// @access  Private
export const addToWatchlist = async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) {
        return res.status(400).json({ msg: 'Symbol is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Add to set to prevent duplicates, then convert back to array
        const watchlistSet = new Set(user.watchlist);
        watchlistSet.add(symbol.toUpperCase());
        user.watchlist = Array.from(watchlistSet);

        await user.save();
        res.json(user.watchlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Remove a stock from the watchlist
// @route   DELETE /api/user/watchlist/:symbol
// @access  Private
export const removeFromWatchlist = async (req, res) => {
    const { symbol } = req.params;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Filter out the symbol to remove
        user.watchlist = user.watchlist.filter(
            (s) => s.toUpperCase() !== symbol.toUpperCase()
        );

        await user.save();
        res.json(user.watchlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};