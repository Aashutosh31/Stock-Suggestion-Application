import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { ThemeProvider } from './context/ThemeContext'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import AuthCallback from './pages/AuthCallback';

// Import all components and pages
import Register from './components/Register'; 
import Login from './components/Login';       
import Dashboard from './pages/Dashboard';    
// --- IMPORT OUR NEW PAGES ---
import TrendsPage from './pages/TrendsPage';
import WatchlistPage from './pages/WatchlistPage';
import SettingsPage from './pages/SettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// --- END IMPORTS ---

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
                {/* Callback Route */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                {/* Private Application Routes (Protected) */}
                {/* --- UPDATE PRIVATE ROUTES --- */}
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                <Route path="/trends" element={<PrivateRoute element={<TrendsPage />} />} />
                <Route path="/sections" element={<PrivateRoute element={<WatchlistPage />} />} />
                <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
                {/* --- END UPDATES --- */}
                
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