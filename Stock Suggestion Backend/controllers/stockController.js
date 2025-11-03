import fetch from 'node-fetch'; // You may need to run: npm install node-fetch
import "dotenv/config";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const API_URL = 'https://www.alphavantage.co/query';

/**
 * Transforms Alpha Vantage TIME_SERIES_DAILY JSON into our clean chart format.
 * @param {object} avData - Raw data from Alpha Vantage
 * @returns {Array} - Array of objects in our { date, Open, High, Low, Close, Volume } format
 */
const transformAlphaVantageData = (avData) => {
    const timeSeries = avData['Time Series (Daily)'];
    if (!timeSeries) {
        throw new Error('Invalid data format from Alpha Vantage. Check API key or symbol.');
    }

    // Convert the AV object-of-objects into an array
    // We also reverse it so the chart plots from left (oldest) to right (newest)
    const chartData = Object.entries(timeSeries)
        .map(([date, values]) => ({
            date: date,
            Open: parseFloat(values['1. open']),
            High: parseFloat(values['2. high']),
            Low: parseFloat(values['3. low']),
            Close: parseFloat(values['4. close']),
            Volume: parseInt(values['5. volume'], 10),
        }))
        .reverse(); // Alpha Vantage sends newest-first, charts need oldest-first

    // For this app, let's just return the last 100 days
    return chartData.slice(-100);
};

// @route   GET /api/stocks/real/:symbol
// @desc    Get REAL stock data from Alpha Vantage, proxied and transformed
// @access  Private (Requires JWT)
export const getRealStockData = async (req, res) => {
    const { symbol } = req.params;
    
    // We must append .BSE or .NSE for Indian stocks for Alpha Vantage
    // This is a simplification; a production system would have a search/lookup service.
    // Let's assume '.BSE' for now (e.g., RELIANCE.BSE, TCS.BSE)
    const avSymbol = `${symbol.toUpperCase()}.BSE`;

    try {
        const fetchUrl = `${API_URL}?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${API_KEY}&outputsize=compact`;
        
        const apiResponse = await fetch(fetchUrl);
        if (!apiResponse.ok) {
            throw new Error(`Alpha Vantage API failed with status: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();

        if (data['Error Message'] || data['Note']) {
             // This catches API limit errors or invalid symbols
            throw new Error(data['Error Message'] || data['Note']);
        }

        // Transform the data into the format our frontend expects
        const transformedData = transformAlphaVantageData(data);

        // Get metadata
        const metaData = data['Meta Data'];
        const latestData = transformedData[transformedData.length - 1];

        // Create a simple AI analysis based on the real data
        const simpleSMA = transformedData.slice(-10).reduce((acc, val) => acc + val.Close, 0) / 10;

        res.json({
            symbol: metaData['2. Symbol'],
            name: `${symbol.toUpperCase()}`, // Simple name
            data: transformedData,
            ai_analysis: {
                latest_price: latestData.Close,
                suggestion: latestData.Close > simpleSMA ? 'On Uptrend' : 'On Downtrend',
                risk_assessment: 'Dynamic Risk',
                trend: `10-Day SMA: ${simpleSMA.toFixed(2)}`,
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Server error fetching real data: ${err.message}` });
    }
};