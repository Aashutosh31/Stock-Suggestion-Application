import React from 'react';
import StockChart from '../components/StockChart';
import { useTheme } from '../context/ThemeContext';

// A simple re-usable card
const TrendCard = ({ title, content }) => (
    <div className="dark:bg-gray-800 bg-white p-6 rounded-xl shadow-lg dark:shadow-xl dark:border dark:border-gray-700">
        <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">{title}</h3>
        <p className="dark:text-gray-300 text-gray-600">{content}</p>
    </div>
);

const TrendsPage = () => {
    const { theme } = useTheme();

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-extrabold dark:text-white text-gray-900">
                Market Trends Analysis
            </h1>
            <p className="text-lg dark:text-gray-400 text-gray-600">
                Comparing major tickers. Data is real (polled) from Alpha Vantage.
            </p>

            {/* This fixes your "undefined" error. We are passing a valid symbol prop. */}
            <StockChart symbol="TCS" />

            {/* You can add more charts or components here */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TrendCard title="NIFTY 50" content="Analysis component for NIFTY 50 (Coming Soon)." />
                <TrendCard title="BANKNIFTY" content="Analysis component for BANKNIFTY (Coming Soon)." />
                <TrendCard title="Sector Analysis" content="Heatmap for sectoral trends (Coming Soon)." />
            </div>
            
            {/* Example of another stock chart on the same page */}
            {/* <StockChart symbol="INFY" /> */}

        </div>
    );
};

export default TrendsPage;