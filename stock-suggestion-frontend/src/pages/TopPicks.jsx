import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // <-- FIXED IMPORT
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';

const MERN_API_BASE_URL = 'https://stock-suggestion-app.onrender.com'; 

/**
 * Fallback fetch for the initial Top Picks list if WebSocket hasn't connected yet.
 */
const fetchTopPicksBatch = async (token) => {
    const res = await fetch(`${MERN_API_BASE_URL}/api/stocks/top-picks`, {
        headers: { 'x-auth-token': token },
    });
    
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || 'Failed to fetch Top Picks.');
    }

    return res.json();
};

const TopPicks = () => {
    const navigate = useNavigate();
    const { topPicks: wsTopPicks, realtimeData } = useWebSocket();
    const { isAuthenticated } = useAuth();
    const token = localStorage.getItem('token');
    
    // React Query for initial data loading/fallback (5-minute cache)
    const { data: batchData, isLoading, isError, error } = useQuery(
        'topPicksBatch', 
        () => fetchTopPicksBatch(token), 
        {
            enabled: isAuthenticated && !!token && wsTopPicks.length === 0, 
            staleTime: 1000 * 60 * 5, 
        }
    );

    // Source of Truth: Prefer WebSocket data, fall back to batch API data
    const sourceData = wsTopPicks.length > 0 ? wsTopPicks : (batchData?.picks || []);

    // Combine batch/ws data with real-time price updates
    const rankedStocks = sourceData.map(stock => {
        const realtime = realtimeData[stock.symbol] || {};
        const latestPrice = realtime.price || stock.latestPrice;
        const changeValue = realtime.change || 0;
        
        return {
            ...stock,
            latestPrice,
            // Prioritize the live signal, fall back to the batch signal (stored in MongoDB)
            signal: realtime.signal || stock.signal || 'HOLD', 
            change: changeValue,
        };
    }).sort((a, b) => b.trendingScore - a.trendingScore); 

    if (isLoading && rankedStocks.length === 0) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-cyan-400 h-[80vh] flex items-center justify-center">
                    Loading Today's Market Summary and AI Rankings...
                </div>
            </DashboardLayout>
        );
    }
    
    const TopPickCard = ({ stock, rank }) => {
        const isBullish = stock.signal === 'BUY' || stock.signal === 'Strong Buy';
        const textColor = isBullish ? 'text-green-400' : 'text-red-400';
        const signalBg = isBullish ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400';
        
        const openDetail = () => navigate(`/stock/${stock.symbol}`);

        return (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: rank * 0.08 }}
                whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0, 200, 255, 0.2)' }}
                onClick={openDetail}
                className={`cursor-pointer p-6 rounded-3xl backdrop-blur-md bg-white/5 dark:bg-gray-800/50 border border-white/10 shadow-2xl space-y-4 relative overflow-hidden transition-all duration-300`}
            >
                {/* Prisma Gradient Overlay for visual effect */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ 
                    background: `radial-gradient(circle at ${rank * 10}%, #1e40af, transparent 70%)` 
                }} />
                
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-sm font-light dark:text-gray-400">Rank #{rank}</span>
                        <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 leading-tight">
                            {stock.symbol}
                        </h3>
                        <p className="text-sm dark:text-gray-400 truncate max-w-xs">{stock.companyName}</p>
                    </div>
                    <div className={`text-center px-3 py-1 rounded-full font-bold text-sm ${signalBg}`}>
                        {stock.signal}
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                    <div>
                        <p className="text-xl font-bold dark:text-white">
                            ₹{stock.latestPrice?.toFixed(2) || 'N/A'}
                        </p>
                        {stock.change !== 0 && (
                            <p className={`text-sm font-semibold ${textColor}`}>
                                {stock.change > 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm dark:text-gray-400">Trend Score</p>
                        <p className="text-xl font-bold text-teal-400">{stock.trendingScore}</p>
                    </div>
                </div>
            </motion.div>
        );
    };


    return (
        <DashboardLayout>
            <div className="space-y-10 p-6 sm:p-10">
                <header className="dark:text-white text-gray-900 border-b border-gray-700/50 pb-4">
                    <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                        Today's Top Picks 🇮🇳
                    </h1>
                    <p className="mt-2 text-lg dark:text-gray-400">
                        High-probability stock suggestions from the NIFTY universe, ranked by our proprietary AI model. Prices update in real-time via WebSocket.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {rankedStocks.length > 0 ? (
                        rankedStocks.map((stock, index) => (
                            <TopPickCard key={stock.symbol} stock={stock} rank={index + 1} />
                        ))
                    ) : (
                        <div className="text-xl dark:text-gray-500 col-span-full">
                           {isError ? `Error fetching data: ${error.message}` : 'No Top Picks available at this time. Please check backend connection.'}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TopPicks;