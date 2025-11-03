import React from 'react';
import useStockData from '../hooks/useStockData';
import { useTheme } from '../context/ThemeContext';
import TradingViewChart from './TradingViewChart'; // --- 1. IMPORT OUR NEW CHART ---

const StockChart = ({ symbol }) => { // --- 2. ACCEPT THE 'symbol' PROP ---
    const { data, isLoading, isError, error } = useStockData(symbol); // 3. Use the symbol
    const { theme } = useTheme(); // --- 4. THIS IS THE FIXED LINE (NO '_') ---

    // 5. Handle Loading State
    if (isLoading) {
        return (
            <div className="dark:bg-gray-800 bg-white shadow-2xl rounded-xl p-6 space-y-6 h-96 flex justify-center items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="dark:text-gray-300 text-lg">Fetching Real Stock Data for {symbol}...</span>
            </div>
        );
    }

    // 6. Handle Error State
    if (isError) {
        return (
            <div className="dark:bg-gray-800 bg-white shadow-2xl rounded-xl p-6 space-y-6 h-96 flex justify-center items-center">
                <div className="text-center p-8 text-red-500 bg-red-900/20 border border-red-500 rounded-lg">
                    <span className='font-semibold'>Data Fetch Error: </span> {error.message}
                </div>
            </div>
        );
    }

    // 7. Handle Empty State
    if (!data) {
        return (
             <div className="dark:bg-gray-800 bg-white shadow-2xl rounded-xl p-6 space-y-6 h-96 flex justify-center items-center">
                <p className="text-center p-8 dark:text-gray-400">No stock data available for {symbol}.</p>
             </div>
        );
    }

    // 8. Data is ready, destructure it
    const { name, data: chartData, ai_analysis } = data;
    
    return (
        <div className="dark:bg-gray-800 bg-white shadow-2xl rounded-xl p-6 space-y-6">
            
            {/* Header and AI Suggestion */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b dark:border-gray-700 pb-4">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
                    {name} ({data.symbol})
                </h2>
                <div className={`p-2 rounded-lg font-bold text-sm ${
                    ai_analysis.suggestion.includes('Uptrend') ? 'bg-green-600 text-white' : 
                    ai_analysis.suggestion.includes('Downtrend') ? 'bg-red-600 text-white' :
                    'bg-yellow-500 text-gray-900'
                }`}>
                    AI Suggestion: {ai_analysis.suggestion}
                </div>
            </div>

            {/* AI Analysis and Risk Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center dark:text-gray-300">
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latest Close Price</p>
                    <p className="text-xl font-bold text-green-400">₹{ai_analysis.latest_price.toFixed(2)}</p>
                </div>
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Assessment</p>
                    <p className="text-xl font-bold dark:text-red-400 text-red-600">{ai_analysis.risk_assessment}</p>
                </div>
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI Trend Basis</p>
                    <p className="text-xl font-bold dark:text-cyan-400 text-cyan-600">{ai_analysis.trend}</p>
                </div>
            </div>

            {/* --- 9. RENDER THE NEW TRADINGVIEW CHART --- */}
            <TradingViewChart data={chartData} />
            
            <p className="text-sm text-center dark:text-gray-500">
                Displaying real, polled data from Alpha Vantage (100-day).
            </p>
        </div>
    );
};

export default StockChart;