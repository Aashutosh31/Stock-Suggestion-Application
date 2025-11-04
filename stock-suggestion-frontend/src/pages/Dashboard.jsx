import React, { useState } from 'react'; // Import useState
import DashboardLayout from '../layout/DashboardLayout';
import StockChart from '../components/StockChart';

const Dashboard = () => {
  // Add state to control the selected stock
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');

  return (
    <DashboardLayout>
      <div className="space-y-6 space-x-0 md:space-x-6 md:space-y-0 p-6">
        <h1 className="text-3xl font-extrabold dark:text-white text-gray-900">
          Main Dashboard
        </h1>
        
        {/* Simple UI to change the selected stock */}
        <div className="flex gap-4 my-4">
          <button 
            onClick={() => setSelectedSymbol('RELIANCE')}
            className={`p-2 px-4 rounded-lg text-white font-semibold transition-all ${selectedSymbol === 'RELIANCE' ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            RELIANCE
          </button>
          <button 
            onClick={() => setSelectedSymbol('TCS')}
            className={`p-2 px-4 rounded-lg text-white font-semibold transition-all ${selectedSymbol === 'TCS' ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            TCS
          </button>
          <button 
            onClick={() => setSelectedSymbol('INFY')}
            className={`p-2 px-4 rounded-lg text-white font-semibold transition-all ${selectedSymbol === 'INFY' ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            INFY
          </button>
        </div>

        {/* Pass the selected symbol as a prop to the chart component */}
        <StockChart symbol={selectedSymbol} />

        {/* Placeholder for the main features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="Current Trends" content="Analyse Market Trends and also what is currently going on in the market." />
          <Card title="Risk Assessment" content="Suggest Potential risks and ups and downs as well." />
          <Card title="Stock Suggestions" content="Suggest the best possible ones to buy and profit margin." />
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