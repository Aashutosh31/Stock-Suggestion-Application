import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- FIXED IMPORT
import { ThemeProvider } from './context/ThemeContext'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import { WebSocketProvider } from './context/WebSocketContext'; // NEW IMPORT

// Import all components and pages
import Register from './components/Register'; 
import Login from './components/Login';       
import Dashboard from './pages/Dashboard';    
import TopPicks from './pages/TopPicks'; // NEW PAGE IMPORT

const queryClient = new QueryClient();

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
                    <QueryClientProvider client={queryClient}> {/* NEW: React Query for API caching */}
                        <WebSocketProvider> {/* NEW: WebSocket for real-time stream */}
                            {/* Apply base background with theme transition */}
                            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                                {/* Global Toast Notification Container */}
                                <Toaster position="top-center" reverseOrder={false} /> 
                                
                                <Routes>
                                    {/* Public Auth Routes */}
                                    <Route path="/" element={<Navigate to="/top-picks" replace />} /> 
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/login" element={<Login />} /> 
                                    
                                    {/* Private Application Routes (Protected) */}
                                    {/* NEW: Home screen for ranked stocks */}
                                    <Route path="/top-picks" element={<PrivateRoute element={<TopPicks />} />} />
                                    
                                    {/* NEW: Dynamic route for detailed charts */}
                                    <Route path="/stock/:symbol" element={<PrivateRoute element={<Dashboard />} />} />

                                    {/* Legacy/Utility routes */}
                                    <Route path="/dashboard" element={<Navigate to="/stock/RELIANCE" replace />} /> 
                                    <Route path="/trends" element={<PrivateRoute element={<TopPicks />} />} /> 
                                    <Route path="/sections" element={<PrivateRoute element={<TopPicks />} />} /> 
                                    <Route path="/settings" element={<PrivateRoute element={<TopPicks />} />} /> 
                                    
                                    {/* Catch-all route */}
                                    <Route path="*" element={<Navigate to="/top-picks" replace />} />

                                </Routes>
                            </div>
                        </WebSocketProvider>
                    </QueryClientProvider>
                </ApiProvider>
            </AuthProvider>
        </Router>
    </ThemeProvider>
  );
};

export default App;