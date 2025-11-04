import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// --- THIS IS THE FIX ---
// It now uses the VITE_API_BASE_URL from your Vercel settings
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Holds { id, name }
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- FIX 1: Wrap login in useCallback ---
    // This ensures the function reference is stable and doesn't
    // trigger useEffect loops in components that depend on it.
    const login = useCallback((token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
    }, []); // No dependencies, this function is stable

    // --- FIX 2: Wrap logout in useCallback ---
    // This is also good practice for the same reason.
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Successfully logged out!');
        navigate('/login');
    }, [navigate]); // Depends on navigate

// This runs on app load/refresh to check if a token exists
    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setLoading(false);
                setIsAuthenticated(false);
                return;
            }

            if (!API_BASE_URL) {
                console.error("CRITICAL: VITE_API_BASE_URL is not defined.");
                setLoading(false);
                setIsAuthenticated(false);
                return;
            }

            try {
                // Call our verification endpoint
                const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                    headers: {
                        'x-auth-token': token,
                    },
                });

                if (res.ok) {
                    const { user } = await res.json(); // Get user { id, name }
                    setUser(user);
                    setIsAuthenticated(true);
                } else {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                }
            } catch (err) {
                // --- THIS IS THE FIX ---
                // If the fetch fails for ANY reason (e.g., server down, network error),
                // you MUST log the user out to prevent an infinite loop.
                console.error('Auth verification failed:', err);
                localStorage.removeItem('token'); // <-- ADD THIS
                setIsAuthenticated(false); // <-- ADD THIS
                // --- END FIX ---
            } finally {
                setLoading(false);
            }
        };
        
        verifyAuth();
        
    }, []); // Empty dependency array means this runs only once on mount

    const contextValue = {
        user,
        isAuthenticated,
        loading,
        login, // This is now the stable, memoized version
        logout // This is now the stable, memoized version
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);