import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import DashboardLayout from '../layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';

// Fetcher function for react-query
const fetchMarketMovers = async () => {
    const { data } = await apiClient.get('/api/stocks/market-movers');
    return data;
};

// A reusable card for displaying a stock
const MoverCard = ({ stock }) => {
    const navigate = useNavigate();
    const isGainer = stock.trendingScore >= 50;
    const scoreColor = isGainer ? 'text-green-400' : 'text-red-400';
    const priceChange = (stock.trendingScore - 50) / 50 * 2; // Simulated % change

    return (
        <div 
            onClick={() => navigate(`/dashboard?symbol=${stock.symbol}`)} // Navigate to dashboard with symbol
            className="dark:bg-gray-800 bg-white p-4 rounded-lg shadow-lg border dark:border-gray-700 cursor-pointer transition-all hover:shadow-cyan-500/20 hover:scale-[1.03]">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold dark:text-white">{stock.symbol}</h3>
                    <p className="text-sm dark:text-gray-400 truncate w-40">{stock.companyName}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-semibold dark:text-white">₹{stock.latestPrice.toFixed(2)}</p>
                    <p className={`text-sm font-bold ${scoreColor}`}>
                        {isGainer ? '▲' : '▼'} {priceChange.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

const TrendsPage = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['marketMovers'],
        queryFn: fetchMarketMovers,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-cyan-400">Loading Market Movers...</div>
            </DashboardLayout>
        );
    }

    if (isError) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-red-500">Error: {error.message}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 p-6">
                <h1 className="text-3xl font-extrabold dark:text-white text-gray-900">
                    Market Trends Analysis
                </h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Gainers */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-green-400">Top Gainers (By Trend Score)</h2>
                        <div className="space-y-3">
                            {data?.gainers.map(stock => (
                                <MoverCard key={stock.symbol} stock={stock} />
                            ))}
                        </div>
                    </div>

                    {/* Top Losers */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-400">Top Losers (By Trend Score)</h2>
                         <div className="space-y-3">
                            {data?.losers.map(stock => (
                                <MoverCard key={stock.symbol} stock={stock} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TrendsPage;