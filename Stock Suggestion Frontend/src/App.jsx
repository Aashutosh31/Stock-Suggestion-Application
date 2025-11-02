import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { ThemeProvider } from './context/ThemeContext'; // 1. Import ThemeProvider
import Register from './components/Register'; 
import Login from './components/Login';       
import Dashboard from './pages/Dashboard';    // 2. Import Dashboard
import DashboardLayout from './layout/DashboardLayout'; // 3. Import Layout

const App = () => {
  return (
    // 4. Wrap with ThemeProvider
    <ThemeProvider>
        <Router>
          {/* Apply base background with theme transition */}
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
            {/* Global Toast Notification Container */}
            <Toaster position="top-center" reverseOrder={false} /> 
            
            <Routes>
              {/* Auth Routes */}
              <Route path="/" element={<Login />} /> 
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} /> 
              
              {/* Main App Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Other pages from Step 2 */}
              <Route path="/trends" element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Trends Analysis Page</div></DashboardLayout>} />
              <Route path="/sections" element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Other Sections Page</div></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Settings Page</div></DashboardLayout>} />

            </Routes>
          </div>
        </Router>
    </ThemeProvider>
  );
};

export default App;