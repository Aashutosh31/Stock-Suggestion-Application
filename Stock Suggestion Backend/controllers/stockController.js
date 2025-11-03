import fetch from 'node-fetch'; 
import "dotenv/config";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const API_URL = 'https://www.alphavantage.co/query';

const transformAlphaVantageData = (avData) => {
    const timeSeries = avData['Time Series (Daily)'];
    if (!timeSeries) {
        console.error("Error: 'Time Series (Daily)' key not found in Alpha Vantage response.");
        throw new Error('Invalid data format from Alpha Vantage. Check API key or symbol.');
    }
    const chartData = Object.entries(timeSeries)
        .map(([date, values]) => ({
            date: date,
            Open: parseFloat(values['1. open']),
            High: parseFloat(values['2. high']),
            Low: parseFloat(values['3. low']),
            Close: parseFloat(values['4. close']),
            Volume: parseInt(values['5. volume'], 10),
        }))
        .reverse();
    return chartData.slice(-100);
};

export const getRealStockData = async (req, res) => {
    
    // const { symbol } = req.params; // <-- We are ignoring the 'RELIANCE' request for this test

    // =================================================================
    // === TEST: Hardcode a free US stock (IBM) ========================
    // =================================================================
    // We will fetch 'IBM' instead of 'RELIANCE.NSE' to prove the API key works.
    const symbol = "IBM";
    const avSymbol = "IBM"; // US stocks don't need an exchange suffix
    console.log(`--- DEBUG: Forcing fetch for US stock: ${avSymbol} ---`);
    // =================================================================

    try {
        const fetchUrl = `${API_URL}?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${API_KEY}&outputsize=compact`;
        
        const apiResponse = await fetch(fetchUrl);
        if (!apiResponse.ok) {
            throw new Error(`Alpha Vantage API failed with status: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();

        // --- Robust Error Handling ---
        if (data['Note']) {
            console.error('Alpha Vantage API Limit Hit:', data['Note']);
            throw new Error(data['Note']);
        }
        if (data['Error Message']) {
            console.error('Alpha Vantage Error:', data['Error Message']);
            throw new Error(data['Error Message']);
        }
        if (!data['Time Series (Daily)']) {
            console.error('Alpha Vantage Error: Response missing "Time Series (Daily)" data.');
            throw new Error(`Alpha Vantage returned no time series data for ${avSymbol}.`);
        }
        // --- End Error Handling ---

        const transformedData = transformAlphaVantageData(data);

        if (!transformedData || transformedData.length === 0) {
            console.error(`Data transformation for ${avSymbol} resulted in an empty array.`);
            throw new Error(`No valid chart data could be processed for ${avSymbol}.`);
        }
        
        const latestData = transformedData[transformedData.length - 1];
        const metaData = data['Meta Data'];

        if (!latestData || typeof latestData.Close === 'undefined') {
             console.error(`Latest data point for ${avSymbol} is invalid.`);
             throw new Error(`Could not determine latest price for ${avSymbol}.`);
        }

        const simpleSMA = transformedData.slice(-10).reduce((acc, val) => acc + val.Close, 0) / 10;

        console.log(`--- DEBUG: Successfully fetched data for ${avSymbol} ---`);

        res.json({
            symbol: metaData ? metaData['2. Symbol'] : avSymbol,
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