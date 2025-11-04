import Stock, { initializeStocks } from '../models/Stock.js';
import cacheService from '../core/cache.js';
import { calculateIndicators, determineSignal, calculateTrendingScore } from './signalService.js';
import { broadcast, setRealTimeScheduler } from '../core/websocket.js'; 
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Make sure node-fetch is imported

dotenv.config();

// --- THE FIX: Use EOD_API_KEY, not Alpha Vantage ---
const API_KEY = process.env.EOD_API_KEY;
const BASE_URL = 'https://eodhistoricaldata.com/api/eod';
// --- END FIX ---

// --- EOD FETCH & CACHE HANDLER (Replaces Alpha Vantage) ---

const fetchAndCacheTimeSeries = async (symbol) => {
    const cacheKey = `eod:daily:${symbol}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
        console.log(`Cache HIT for ${symbol}`);
        return cachedData;
    }

    // --- THE FIX: Use EOD URL and log message ---
    console.log(`Cache MISS for ${symbol}. Fetching from EOD Historical Data...`);

    // Mandatory Rate Limit Management: 13-second delay between calls
    // (Keeping this as a safety measure, though EOD is less strict)
    await new Promise(resolve => setTimeout(resolve, 13000)); 
    
    const eodSymbol = `${symbol.toUpperCase()}.NSE`;
    const url = `${BASE_URL}/${eodSymbol}?api_token=${API_KEY}&fmt=json&period=d`; 
    // --- END FIX ---

    const response = await fetch(url);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`EOD API Error for ${symbol}:`, errorText);
        throw new Error(errorText || 'EOD API Error.');
    }
    
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️ EOD returned no time series data for ${symbol}. Skipping fetch.`);
        return null;
    }
    
    // --- THE FIX: Transform EOD data (it's an array, not an object) ---
    // Map to all lowercase keys to match the chart library's defaults
    const transformedData = data.map(item => ({
        date: item.date,
        Open: parseFloat(item.open),
        High: parseFloat(item.high),
        Low: parseFloat(item.low),
        Close: parseFloat(item.close),
        Volume: parseInt(item.volume, 10),
    })).sort((a, b) => new Date(a.date) - new Date(b.date)); 
    // --- END FIX ---

    const enrichedData = calculateIndicators(transformedData);
    await cacheService.set(cacheKey, enrichedData, 43200); // Cache for 12 hours

    return enrichedData;
};


// --- PUBLIC DATA EXPOSURE METHODS (Rest of the file remains the same) ---

export const getDailyStockData = async (symbol) => {
    // This function is now consistent with the batch update
    const enrichedData = await fetchAndCacheTimeSeries(symbol);
    if (!enrichedData || enrichedData.length === 0) return null; 

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
            // This will now call the EOD-based function
            const enrichedData = await fetchAndCacheTimeSeries(stock.symbol);
            
            if (!enrichedData || enrichedData.length === 0) continue; 
            
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
        // This 'clients' variable is now correctly passed from core/websocket.js
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