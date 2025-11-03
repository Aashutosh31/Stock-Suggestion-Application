// Note: These are simplified implementations. Full, enterprise-grade TIs require a dedicated library.
// We keep them contained here for modularity.

/**
 * Helper function to calculate Simple Moving Average (SMA).
 * @param {Array<number>} data - Array of closing prices.
 * @param {number} window - The period (e.g., 50 days).
 * @returns {number} The SMA value or the last price as a fallback.
 */
const calculateSMA = (data, window) => {
    if (data.length < window) return data[data.length - 1] || 0;
    const slice = data.slice(-window);
    return slice.reduce((sum, val) => sum + val, 0) / window;
};

/**
 * Calculates a proxy value for Relative Strength Index (RSI).
 * In production, this is a complex rolling average calculation.
 * @returns {number} Simulated RSI (25 to 75).
 */
const calculateRSI = (closes, period = 14) => {
    if (closes.length < period) return 50; 
    // Simulate RSI fluctuation based on the latest trend
    const lastChange = closes[closes.length - 1] - closes[closes.length - 2] || 0;
    return Math.min(90, Math.max(10, 50 + lastChange * 10 / closes[closes.length - 1] * 100));
};

/**
 * Calculates a proxy value for Moving Average Convergence Divergence (MACD).
 * @returns {number} Simulated MACD (-5 to +5).
 */
const calculateMACD = (closes) => {
    if (closes.length < 26) return 0;
    // Simulate MACD based on price difference vs a long average
    const shortAvg = calculateSMA(closes, 12);
    const longAvg = calculateSMA(closes, 26);
    return (shortAvg - longAvg) / closes[closes.length - 1] * 100;
};

/**
 * Enriches historical data with calculated Technical Indicators.
 * @param {Array<object>} data - OHLCV data array.
 * @returns {Array<object>} Enriched data.
 */
export const calculateIndicators = (data) => {
    const closes = data.map(d => d.Close);
    const enrichedData = [];

    for (let i = 0; i < data.length; i++) {
        const currentCloses = closes.slice(0, i + 1);
        const currentData = { ...data[i] };

        currentData.SMA_50 = calculateSMA(currentCloses, 50);
        currentData.SMA_200 = calculateSMA(currentCloses, 200);
        currentData.RSI = calculateRSI(currentCloses, 14);
        currentData.MACD = calculateMACD(currentCloses);
        
        // Use the last calculated value as fallback for early data points (less than window)
        if (i > 0) {
            currentData.SMA_50 = currentData.SMA_50 || enrichedData[i-1].SMA_50;
            currentData.SMA_200 = currentData.SMA_200 || enrichedData[i-1].SMA_200;
        }

        enrichedData.push(currentData);
    }
    
    // Attach the suggestion based on the final data point
    const latestData = enrichedData[enrichedData.length - 1];
    if (latestData) {
        const { signal } = determineSignal(latestData);
        latestData.AI_Suggestion = signal;
    }

    return enrichedData;
};

/**
 * Determines the final trading signal based on latest indicators.
 * @param {object} latestData - The most recent enriched data point.
 * @returns {{signal: string, reason: string}} Trading signal and rationale.
 */
export const determineSignal = (latestData) => {
    const { Close, SMA_50, RSI, MACD } = latestData;
    let signal = 'HOLD';
    let reason = 'Consolidating';

    if (RSI < 30 && MACD > 0) {
        signal = 'Strong Buy';
        reason = 'MACD Crossover in Oversold territory.';
    } else if (Close > SMA_50 && MACD > 0) {
        signal = 'Buy';
        reason = 'Price is above the 50-day SMA with positive MACD.';
    } else if (Close < SMA_50 && RSI < 50) {
        signal = 'Sell';
        reason = 'Price below 50-day SMA and weakening RSI.';
    }
    
    return { signal, reason };
};

/**
 * Calculates a proprietary score used for the "Top Picks" ranking.
 * Score is weighted by momentum, relative strength, and long-term trend.
 * @param {object} latestData - The latest enriched data point.
 * @returns {number} Normalized Trending Score (0-100).
 */
export const calculateTrendingScore = (latestData) => {
    const { Close, Open, RSI, MACD, SMA_200 } = latestData;
    let score = 50; // Base score
    
    // Daily Change Momentum (50% weight)
    score += (Close - Open) / Close * 2500; 

    // RSI Strength (25% weight)
    score += (RSI - 50); 

    // MACD Confirmation (25% weight)
    score += MACD * 5; 

    // Long-term trend bonus
    if (Close > SMA_200) score += 10;
    
    return Math.min(100, Math.max(0, Math.round(score))); 
};