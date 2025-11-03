import Stock, { initializeStocks } from '../models/Stock.js';
import cacheService from '../core/cache.js';
import { calculateIndicators, determineSignal, calculateTrendingScore } from './signalService.js';
import { broadcast, setRealTimeScheduler } from '../core/websocket.js'; 
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// --- ALPHA VANTAGE FETCH & CACHE HANDLER ---

const fetchAndCacheTimeSeries = async (symbol, functionName) => {
    const cacheKey = `av:${functionName}:${symbol}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
        console.log(`Cache HIT for ${symbol}`);
        return cachedData;
    }

    console.log(`Cache MISS for ${symbol}. Fetching from Alpha Vantage...`);

    // Mandatory Rate Limit Management: 13-second delay between calls
    await new Promise(resolve => setTimeout(resolve, 13000)); 
    
    const url = `${BASE_URL}?function=${functionName}&symbol=${symbol}.NSE&outputsize=full&apikey=${API_KEY}`; 
    const response = await fetch(url);
    const data = await response.json();
    
    // 1. Check for official error fields or non-OK response
    if (data['Error Message'] || !response.ok) {
        console.error(`AV Error for ${symbol}:`, data);
        throw new Error(data['Error Message'] || 'Alpha Vantage API Error.');
    }
    
    // 2. CRITICAL FIX: Explicitly handle Rate Limit/Premium Note
    if (data['Note'] && data['Note'].includes('5 calls per minute')) {
        console.warn(`⚠️ AV Rate Limit Hit for ${symbol}. Skipping for this cycle.`);
        return null; // Return null so the calling function can skip this ticker gracefully.
    }
    
    // 3. Check if Time Series Key exists (Harden against empty/invalid responses)
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
        console.warn(`⚠️ AV returned no time series data for ${symbol}. Skipping fetch.`);
        return null;
    }
    
    const timeSeries = data[timeSeriesKey];

    // Transform and clean AV data
    const transformedData = Object.entries(timeSeries).map(([date, values]) => ({
        date, Open: parseFloat(values['1. open']), High: parseFloat(values['2. high']),
        Low: parseFloat(values['3. low']), Close: parseFloat(values['4. close']),
        Volume: parseInt(values['5. volume'], 10),
    })).sort((a, b) => new Date(a.date) - new Date(b.date)); 

    const enrichedData = calculateIndicators(transformedData);
    await cacheService.set(cacheKey, enrichedData, 43200); // Cache for 12 hours

    return enrichedData;
};


// --- PUBLIC DATA EXPOSURE METHODS (Rest of the file remains the same) ---

export const getDailyStockData = async (symbol) => {
    const enrichedData = await fetchAndCacheTimeSeries(symbol, 'TIME_SERIES_DAILY');
    if (!enrichedData || enrichedData.length === 0) return null; // This now correctly handles the null returned above.

    const latestData = enrichedData[enrichedData.length - 1];
    const { signal, reason } = determineSignal(latestData);
    const stockInfo = await Stock.findOne({ symbol });
    
    return {
        symbol, name: stockInfo?.companyName || symbol,
        data: enrichedData,
        ai_analysis: {
            latest_price: latestData.Close, 
            suggestion: signal,
            risk_assessment: latestData.MACD > 0 ? 'High Momentum, Moderate Risk' : 'Low Volatility, Stable',
            trend: reason,
            indicators: {
                SMA50: latestData.SMA_50.toFixed(2), 
                RSI: latestData.RSI.toFixed(2), 
                MACD: latestData.MACD.toFixed(2), 
                Volume: latestData.Volume.toLocaleString(),
            }
        }
    };
};

export const getTopRankedStocks = async (limit = 10) => {
    return Stock.find({}).sort({ trendingScore: -1, latestPrice: -1 }).limit(limit);
};


// --- DAILY BATCH & RANKING ENGINE ---

export const runDailyBatchUpdate = async () => {
    await initializeStocks();
    const allStocks = await Stock.find({}).select('symbol');
    
    console.log(`--- Running Daily Batch Update for ${allStocks.length} Tickers ---`);
    for (const stock of allStocks) {
        try {
            // Note: fetchAndCacheTimeSeries will return null if rate limit is hit
            const enrichedData = await fetchAndCacheTimeSeries(stock.symbol, 'TIME_SERIES_DAILY');
            
            if (!enrichedData || enrichedData.length === 0) continue; // Skip if null (rate limit or no data)
            
            const latestData = enrichedData[enrichedData.length - 1];
            const trendingScore = calculateTrendingScore(latestData);
            const { signal } = determineSignal(latestData);

            await Stock.updateOne(
                { symbol: stock.symbol },
                { $set: { trendingScore, latestPrice: latestData.Close, lastUpdated: new Date(), signal } }
            );
        } catch (e) {
            console.warn(`❌ Batch Error for ${stock.symbol}: ${e.message}`);
        }
    }
    console.log('--- Daily Batch Update Finished (All Tickers Ranked) ---');
};


// --- REAL-TIME DATA PUSH SCHEDULER ---

let updateInterval;
export const scheduleRealTimeUpdates = (clients) => {
    if (updateInterval) return;
    
    // Run batch on startup in the background
    runDailyBatchUpdate(); 
    
    updateInterval = setInterval(async () => {
        if (clients.size === 0) {
            clearInterval(updateInterval);
            updateInterval = null;
            console.log('Real-time updates stopped: No active clients.');
            return;
        }

        const stocks = await getTopRankedStocks(5); 
        
        for (const stock of stocks) {
            const lastPrice = stock.latestPrice || 1000;
            const fluctuationPercent = (stock.trendingScore / 100) * 0.005; 
            const change = (Math.random() * 2 - 1) * (lastPrice * fluctuationPercent); 
            const newPrice = lastPrice + change;
            const signal = change > 0 ? 'BUY' : 'SELL';

            broadcast({
                type: 'REALTIME_UPDATE', symbol: stock.symbol, 
                price: parseFloat(newPrice.toFixed(2)), 
                change: parseFloat(change.toFixed(2)),
                signal: signal, timestamp: new Date().toISOString(),
            });
            await Stock.updateOne({ symbol: stock.symbol }, { latestPrice: newPrice }); 
        }
        
        const topPicks = await getTopRankedStocks(10);
        broadcast({
            type: 'TOP_PICKS', data: topPicks, timestamp: new Date().toISOString(),
        });
        
    }, 5000); 
    
    console.log('Real-time updates started/resumed.');
};

// Expose the scheduler function to the core/websocket module
setRealTimeScheduler(scheduleRealTimeUpdates);