import fetch from 'node-fetch'; 
import "dotenv/config";
import Stock from '../models/Stock.js';

const API_KEY = process.env.EOD_API_KEY;
const API_URL = 'https://eodhistoricaldata.com/api/eod/';

        // --- 2. ADD THIS ENTIRE FUNCTION ---
        // @route   GET /api/stocks/market-movers
        // @desc    Get top 5 gainers and losers
        // @access  Private
        export const getMarketMovers = async (req, res) => {
            try {
                // Fetch top 5 stocks with the highest trendingScore
                const gainers = await Stock.find({})
                    .sort({ trendingScore: -1 })
                    .limit(5);

                // Fetch top 5 stocks with the lowest trendingScore
                const losers = await Stock.find({})
                    .sort({ trendingScore: 1 })
                    .limit(5);

                res.json({ gainers, losers });

            } catch (err) {
                console.error("Error in getMarketMovers:", err.message);
                res.status(500).json({ msg: "Server Error" });
            }
        };
        // --- END OF NEW FUNCTION ---


        // @route   GET /api/stocks/real/:symbol
        // @desc    Get REAL stock data from EOD Historical Data
        // @access  Private (Requires JWT)
        export const getRealStockData = async (req, res) => {
        const { symbol } = req.params;
        const eodSymbol = `${symbol.toUpperCase()}.NSE`;

        console.log(`Fetching data for: ${eodSymbol}`);

        try {
            const fetchUrl = `${API_URL}${eodSymbol}?api_token=${API_KEY}&fmt=json&period=d`;
            
            const apiResponse = await fetch(fetchUrl);

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error(`EOD API Error: ${errorText}`);
                throw new Error(`Failed to fetch data from EOD: ${errorText}`);
            }
            
            const data = await apiResponse.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`EOD API returned no data for ${eodSymbol}.`);
            }

            // --- THE FIX ---
            // Map to all lowercase keys to match the chart library's defaults
            const transformedData = data.map(item => ({
                date: item.date,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
            })).slice(-100); // Get the last 100 days
            // --- END FIX ---

            const latestData = transformedData[transformedData.length - 1];
            
            if (!latestData) {
                throw new Error("Could not get latest data point.");
            }
            
            // Use lowercase 'close' for SMA calculation
            const simpleSMA = transformedData.slice(-10).reduce((acc, val) => acc + val.close, 0) / 10;

            res.json({
                symbol: eodSymbol,
                name: `${symbol.toUpperCase()}`,
                data: transformedData, // This array now has all lowercase keys
                ai_analysis: {
                    // Read from the lowercase 'close' property
                    latest_price: latestData.close, 
                    suggestion: latestData.close > simpleSMA ? 'On Uptrend' : 'On Downtrend',
                    risk_assessment: 'Dynamic Risk',
                    trend: `10-Day SMA: ${simpleSMA.toFixed(2)}`,
                }
            });

        } catch (err) {
            console.error("Error in getRealStockData:", err.message);
            res.status(500).json({ msg: err.message });
        }
        };
