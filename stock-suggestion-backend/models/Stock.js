import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
    // Unique identifier for the stock
    symbol: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    exchange: {
        type: String,
        required: true,
        enum: ['NSE', 'BSE'], // Restrict to Indian exchanges
        default: 'NSE',
    },
    // Daily metrics calculated by the server's AI engine
    trendingScore: {
        type: Number,
        default: 0,
        index: true, // Index this field for fast ranking queries (Top Picks)
    },
    latestPrice: {
        type: Number,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

const Stock = mongoose.model('Stock', StockSchema);

// --- Define Core Trading Universe (NIFTY 50 Subset) ---
export const initialStocks = [
    { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', exchange: 'NSE' },
    { symbol: 'TCS', companyName: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd.', exchange: 'NSE' },
    { symbol: 'INFY', companyName: 'Infosys Ltd.', exchange: 'NSE' },
    { symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd.', exchange: 'NSE' },
    { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank', exchange: 'NSE' },
    { symbol: 'ITC', companyName: 'ITC Ltd.', exchange: 'NSE' },
    { symbol: 'LT', companyName: 'Larsen & Toubro Ltd.', exchange: 'NSE' },
    { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd.', exchange: 'NSE' },
    { symbol: 'SBIN', companyName: 'State Bank of India', exchange: 'NSE' }
];

// Utility function to seed the database with initial tickers
export const initializeStocks = async () => {
    for (const stock of initialStocks) {
        await Stock.findOneAndUpdate(
            { symbol: stock.symbol },
            { $setOnInsert: stock },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    console.log(`✅ ${initialStocks.length} core stocks initialized/verified.`);
};

export default Stock;