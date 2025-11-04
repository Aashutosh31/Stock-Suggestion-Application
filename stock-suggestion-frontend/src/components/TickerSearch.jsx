import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock list based on the core stocks defined in the backend for fast client-side suggestions
const MOCK_TICKERS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
    { symbol: 'TCS', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
    { symbol: 'INFY', name: 'Infosys Ltd.' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { symbol: 'ITC', name: 'ITC Ltd.' },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.' },
    { symbol: 'SBIN', name: 'State Bank of India' }
];

const TickerSearch = ({ initialSymbol }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(initialSymbol || '');
    const [isFocused, setIsFocused] = useState(false);

    // Filter suggestions based on current query
    const suggestions = useMemo(() => {
        if (!searchQuery) return MOCK_TICKERS.slice(0, 5);
        const query = searchQuery.toUpperCase();
        return MOCK_TICKERS.filter(stock => 
            stock.symbol.includes(query) || stock.name.toUpperCase().includes(query)
        ).slice(0, 5); 
    }, [searchQuery]);

    const handleSelect = (symbol) => {
        const upperSymbol = symbol.toUpperCase();
        setSearchQuery(upperSymbol);
        setIsFocused(false);
        // Navigate to the new dynamic detail page route
        navigate(`/stock/${upperSymbol}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery) {
            handleSelect(searchQuery);
        }
    };

    return (
        <div className="relative w-full max-w-sm">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search Indian Ticker (e.g., RELIANCE)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    // Use onBlur delay to allow click on suggestions before hiding
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
                    className="w-full px-4 py-3 dark:bg-gray-700 bg-gray-100 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 dark:text-white placeholder-gray-500 shadow-lg"
                />
            </form>
            
            {isFocused && (suggestions.length > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-20 mt-2 w-full dark:bg-gray-800/95 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden"
                >
                    {suggestions.map(stock => (
                        <div
                            key={stock.symbol}
                            onClick={() => handleSelect(stock.symbol)}
                            className="p-3 cursor-pointer dark:hover:bg-gray-700 hover:bg-gray-200 transition duration-150 dark:text-white text-gray-800 flex justify-between items-center"
                        >
                            <span className="font-semibold text-cyan-400">{stock.symbol}</span>
                            <span className="text-sm dark:text-gray-400">{stock.name}</span>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default TickerSearch;