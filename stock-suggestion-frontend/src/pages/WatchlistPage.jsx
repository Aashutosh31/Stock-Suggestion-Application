import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import DashboardLayout from '../layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';

// Fetcher function
const fetchWatchlist = async () => {
    const { data } = await apiClient.get('/api/user/watchlist');
    return data;
};

// Re-use the MoverCard component logic for our watchlist
const WatchlistCard = ({ stock }) => {
    const navigate = useNavigate();
    const isGainer = stock.trendingScore >= 50;
    const scoreColor = isGainer ? 'text-green-400' : 'text-red-400';
    
    return (
        <div 
            onClick={() => navigate(`/dashboard?symbol=${stock.symbol}`)}
            className="dark:bg-gray-800 bg-white p-4 rounded-lg shadow-lg border dark:border-gray-700 cursor-pointer transition-all hover:shadow-cyan-500/20 hover:scale-[1.03]">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold dark:text-white">{stock.symbol}</h3>
                    <p className="text-sm dark:text-gray-400 truncate w-40">{stock.companyName}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-semibold dark:text-white">₹{stock.latestPrice.toFixed(2)}</p>
                    <p className={`text-sm font-bold ${scoreColor}`}>
                        Score: {stock.trendingScore}
                    </p>
                </div>
            </div>
        </div>
    );
};


const WatchlistPage = () => {
    const { data: watchlist, isLoading, isError } = useQuery({
        queryKey: ['watchlist'],
        queryFn: fetchWatchlist,
    });

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <h1 className="text-3xl font-extrabold dark:text-white text-gray-900">
                    My Watchlist
                </h1>
                
                {isLoading && <div className="text-center p-8 text-cyan-400">Loading Watchlist...</div>}
                {isError && <div className="text-center p-8 text-red-500">Error loading watchlist.</div>}
                
                {watchlist && watchlist.length === 0 && (
                     <div className="text-center p-8 text-gray-500">
                        Your watchlist is empty. Find stocks on the Dashboard to add them.
                    </div>
                )}
                
                {watchlist && watchlist.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {watchlist.map(stock => (
                            <WatchlistCard key={stock.symbol} stock={stock} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WatchlistPage;