import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useStockData from '../hooks/useStockData';
import { useTheme } from '../context/ThemeContext';

const StockChart = () => {
    const { data, loading, error } = useStockData();
    const { theme } = useTheme();

    if (loading) {
        return <div className="text-center p-8 dark:text-gray-300">Loading real-time stock data...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }

    if (!data) {
        return <div className="text-center p-8 dark:text-gray-400">No stock data available.</div>;
    }

    const { symbol, name, data: chartData, ai_analysis } = data;
    const isDarkMode = theme === 'dark';

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
                    'bg-yellow-500 text-gray-900'
                }`}>
                    AI Suggestion: {ai_analysis.suggestion}
                </div>
            </div>

            {/* AI Analysis and Risk Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center dark:text-gray-300">
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latest Price</p>
                    <p className="text-xl font-bold text-green-400">₹{ai_analysis.latest_price}</p>
                </div>
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Assessment</p>
                    <p className="text-xl font-bold dark:text-red-400 text-red-600">{ai_analysis.risk_assessment}</p>
                </div>
                <div className="dark:bg-gray-700 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trend Analysis</p>
                    <p className="text-xl font-bold dark:text-cyan-400 text-cyan-600">{ai_analysis.trend}</p>
                </div>
            </div>


            {/* Responsive Chart Container for "graphs monthly weekly data trends" */}
            <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="date" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} domain={['dataMin - 100', 'dataMax + 100']} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                                border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                                borderRadius: '8px',
                                color: isDarkMode ? '#ffffff' : '#1f2937'
                            }} 
                        />
                        <Legend wrapperStyle={{ color: isDarkMode ? '#ffffff' : '#1f2937' }} />
                        
                        {/* Closing Price Line: A strong visual element */}
                        <Line 
                            type="monotone" 
                            dataKey="Close" 
                            stroke="#34D399" // Green/Teal for positive feel
                            strokeWidth={3}
                            dot={false}
                            name="Closing Price (INR)"
                            activeDot={{ r: 8, fill: '#34D399' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="Volume" 
                            stroke="#60A5FA" // Blue for contrast
                            dot={false}
                            name="Volume"
                            yAxisId={1}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-center dark:text-gray-500">
                Data simulated for **Reliance Industries Ltd.** to demonstrate core API/AI functionality.
            </p>
        </div>
    );
};

export default StockChart;