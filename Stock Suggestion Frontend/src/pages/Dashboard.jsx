import React from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import DashboardLayout from '../layout/DashboardLayout';
import StockChart from '../components/StockChart';
import TickerSearch from '../components/TickerSearch'; // NEW IMPORT

const Dashboard = () => {
  // Get the stock symbol from the URL parameter (e.g., /stock/RELIANCE)
  const { symbol } = useParams(); 
  const defaultSymbol = symbol ? symbol.toUpperCase() : 'RELIANCE'; 

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header with Ticker Search */}
        <header className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-700/50">
            <h1 className="text-4xl font-extrabold dark:text-white text-gray-900 mb-4 sm:mb-0">
              Stock Detail View
            </h1>
            <TickerSearch initialSymbol={defaultSymbol} /> 
        </header>

        {/* Pass the dynamic symbol to the StockChart component */}
        <StockChart symbol={defaultSymbol} /> 

        {/* Placeholder cards remain for consistency and structure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Current Trends" content="Analyse market trends and identify long-term patterns based on technical indicators." />
          <Card title="Risk Assessment" content="Evaluate volatility and potential downside exposure before making an investment." />
          <Card title="Profit Maximization" content="Review historical performance to set optimal entry and exit points for high profit margin." />
        </div>
      </div>
    </DashboardLayout>
  );
};

// Reusable Card Component for a clean layout
const Card = ({ title, content }) => (
    <div className="dark:bg-gray-800 bg-white p-6 rounded-xl shadow-lg dark:shadow-xl dark:border dark:border-gray-700 transition duration-300 transform hover:scale-[1.02] hover:shadow-blue-500/30">
        <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">{title}</h3>
        <p className="dark:text-gray-300 text-gray-600">{content}</p>
    </div>
);

export default Dashboard;