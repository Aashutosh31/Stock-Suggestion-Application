import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; 
import useStockData from '../hooks/useStockData';
import { useTheme } from '../context/ThemeContext';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'; // Import the real-time hook

// Custom Tooltip (Final, Robust Implementation)
const CustomTooltip = ({ active, payload, label }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    // Robust initial check for active state and data presence
    if (!active || !payload || payload.length === 0) {
        return null;
    }
    
    // Safely access the data point from the payload structure
    const dataPoint = payload[0]?.payload; 

    // Final defensive check to prevent reading 'toFixed' on undefined
    if (!dataPoint || typeof dataPoint.Close === 'undefined' || typeof dataPoint.Open === 'undefined') {
        return null;
    }

    const isBullish = dataPoint.Close > dataPoint.Open;
    const color = isBullish ? 'text-green-400' : 'text-red-400';

    return (
        <div className={`p-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border border-gray-600`}>
            <p className="font-bold text-lg dark:text-white mb-2">{label}</p>
            <p className={`text-sm ${color}`}>Close: ₹{dataPoint.Close.toFixed(2)}</p>
            <p className="text-sm dark:text-gray-300">Open: ₹{dataPoint.Open.toFixed(2)}</p>
            <p className="text-sm dark:text-gray-300">High: ₹{dataPoint.High.toFixed(2)}</p>
            <p className="text-sm dark:text-gray-300">Low: ₹{dataPoint.Low.toFixed(2)}</p>
            <p className="text-sm text-blue-400">Volume: {dataPoint.Volume.toLocaleString()}</p>
        </div>
    );
};


const StockChart = () => {
    // 1. Initial data fetch using react-query
    const { data, isLoading, isError, error } = useStockData('RELIANCE');
    const { theme } = useTheme();

    // 2. Establish WebSocket connection and listen for updates
    useRealtimeUpdates();

    // 3. Handle Loading State
    if (isLoading) {
        return <div className="text-center p-8 dark:text-gray-300 text-lg flex justify-center items-center h-96">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching Live/Simulated Stock Data...
        </div>;
    }

    // 4. Handle Error State
    if (isError) {
        return <div className="text-center p-8 text-red-500 bg-red-900/20 border border-red-500 rounded-lg h-96 flex items-center justify-center">
            <span className='font-semibold'>Data Fetch Error: </span> {error.message}
        </div>;
    }

    // 5. Handle Empty State
    if (!data) {
        return <div className="text-center p-8 dark:text-gray-400 h-96 flex items-center justify-center">No stock data available. Please check the backend connection.</div>;
    }

    // 6. Data is ready, destructure it
    const { symbol, name, data: chartData, ai_analysis } = data;
    const isDarkMode = theme === 'dark';
    
    // This logic is now robust as our data source (backend mock or live tick) provides OHLC
    const getBarColor = (data) => {
        return data.Close >= data.Open ? '#34D399' : '#EF4444'; // Green or Red
    };

    return (
        <div className="dark:bg-gray-800 bg-white shadow-2xl rounded-xl p-6 space-y-6">
            
            {/* Header and AI Suggestion */}
            <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-500">
                    {name} ({symbol})
                </h2>
                <div className={`p-2 rounded-lg font-bold text-sm ${
                    ai_analysis.suggestion.includes('Strong Buy') ? 'bg-green-600 text-white' : 
                    ai_analysis.suggestion.includes('Buy') ? 'bg-green-500 text-white' : 
                    ai_analysis.suggestion.includes('Sell') ? 'bg-red-600 text-white' :
                    'bg-yellow-500 text-gray-900'
                }`}>
                    AI Suggestion: {ai_analysis.suggestion}
                </div>
            </div>

            {/* AI Analysis and Risk Panel (These values will update live via WebSocket) */}
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


            {/* Responsive Chart Container */}
            <div className="w-full h-96 min-w-0"> 
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData} // This data is now live-updated via react-query
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis yAxisId="price" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} orientation="left" domain={['dataMin - 100', 'dataMax + 100']} />
                        <YAxis yAxisId="volume" stroke="#60A5FA" orientation="right" allowDecimals={false} />
                        
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#ffffff' : '#1f2937' }} />
                        
                        <Bar 
                            yAxisId="price"
                            dataKey="Close" 
                            name="Price (Close)"
                        >
                            {chartData.map((entry, index) => (
                                <Bar key={`bar-${index}`} fill={getBarColor(entry)} />
                            ))}
                        </Bar>
                        <Bar 
                            yAxisId="volume"
                            dataKey="Volume" 
                            name="Volume (Right Axis)"
                            fill="#60A5FA80" 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-center dark:text-gray-500">
                **Live Data Pipeline** is active. Price and trend will update every 5 seconds.
            </p>
        </div>
    );
};

export default StockChart;