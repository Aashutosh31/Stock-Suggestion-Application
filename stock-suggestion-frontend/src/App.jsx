import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { ThemeProvider } from './context/ThemeContext'; 
import { AuthProvider, useAuth } from './context/AuthContext'; // Updated imports
import { ApiProvider } from './context/ApiContext'; // New API Provider

// Import all components and pages
import Register from './components/Register'; 
import Login from './components/Login';       
import Dashboard from './pages/Dashboard';    
import DashboardLayout from './layout/DashboardLayout'; 

// --- PrivateRoute Component for protected routes ---
const PrivateRoute = ({ element: Element }) => {
    const { isAuthenticated, loading } = useAuth();
    
    // Show a minimal loader while checking auth status
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 text-xl text-cyan-400">Loading Session...</div>;
    }
    
    // Redirect unauthenticated users to the login page
    return isAuthenticated ? Element : <Navigate to="/login" replace />;
};

const App = () => {
  return (
<ThemeProvider>
<Router>
    {/* Wrap the core logic with AuthProvider and ApiProvider */}
<AuthProvider> 
    <ApiProvider>
        {/* Apply base background with theme transition */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
            {/* Global Toast Notification Container */}
            <Toaster position="top-center" reverseOrder={false} /> 
            
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/" element={<Login />} /> 
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} /> 
                
                {/* Private Application Routes (Protected) */}
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                
                {/* Other protected pages (using PrivateRoute) */}
                <Route path="/trends" element={<PrivateRoute element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Trends Analysis Page (Coming Soon)</div></DashboardLayout>} />} />
                <Route path="/sections" element={<PrivateRoute element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Other Sections Page (Coming Soon)</div></DashboardLayout>} />} />
                <Route path="/settings" element={<PrivateRoute element={<DashboardLayout><div className="text-3xl p-8 dark:text-white">Settings Page (Coming Soon)</div></DashboardLayout>} />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
        </div>
    </ApiProvider>
</AuthProvider>
</Router>
</ThemeProvider>
  );
};

export default App;