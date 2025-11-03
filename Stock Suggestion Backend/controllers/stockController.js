import fetch from 'node-fetch'; 
import "dotenv/config";

// 1. Use the new API Key and URL
const API_KEY = process.env.EOD_API_KEY;
const API_URL = 'https://eodhistoricaldata.com/api/eod/';

// 2. We no longer need the old transform function. This file is now simpler.

// @route   GET /api/stocks/real/:symbol
// @desc    Get REAL stock data from EOD Historical Data
// @access  Private (Requires JWT)
export const getRealStockData = async (req, res) => {
    const { symbol } = req.params;
    
    // 3. Create the symbol for EOD (e.g., RELIANCE.NSE)
    const eodSymbol = `${symbol.toUpperCase()}.NSE`;
    
    console.log(`Fetching data for: ${eodSymbol}`);

    try {
        // 4. Create the new URL.
        // &fmt=json tells it to send JSON
        // &period=d gets daily data
        const fetchUrl = `${API_URL}${eodSymbol}?api_token=${API_KEY}&fmt=json&period=d`;
        
        const apiResponse = await fetch(fetchUrl);

        // 5. Robust error check. If the API fails, it often sends text, not JSON.
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`EOD API Error: ${errorText}`);
            throw new Error(`Failed to fetch data from EOD: ${errorText}`);
        }
        
        // 6. Get the JSON. This API returns an ARRAY [...] directly.
        const data = await apiResponse.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error(`EOD API returned no data for ${eodSymbol}.`);
        }

        // 7. Transform the data.
        // The frontend chart expects: { date, Open, High, Low, Close, Volume }
        // The EOD API sends: { date, open, high, low, close, volume }
        const transformedData = data.map(item => ({
            date: item.date,
            Open: item.open,   // <-- Map from lowercase
            High: item.high,   // <-- Map from lowercase
            Low: item.low,     // <-- Map from lowercase
            Close: item.close, // <-- Map from lowercase
            Volume: item.volume // <-- Map from lowercase
        })).slice(-100); // Get the last 100 days

        const latestData = transformedData[transformedData.length - 1];

        // 8. Create the same AI analysis
        const simpleSMA = transformedData.slice(-10).reduce((acc, val) => acc + val.Close, 0) / 10;

        // 9. Send the exact same JSON structure the frontend expects
        res.json({
            symbol: eodSymbol,
            name: `${symbol.toUpperCase()}`,
            data: transformedData,
            ai_analysis: {
                latest_price: latestData.Close,
                suggestion: latestData.Close > simpleSMA ? 'On Uptrend' : 'On Downtrend',
                risk_assessment: 'Dynamic Risk',
                trend: `10-Day SMA: ${simpleSMA.toFixed(2)}`,
            }
        });

    } catch (err) {
        console.error("Error in getRealStockData:", err.message);
        res.status(500).json({ msg: err.message });
    }
};