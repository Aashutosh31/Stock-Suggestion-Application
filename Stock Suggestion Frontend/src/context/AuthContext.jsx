import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Holds { id, name }
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Successfully logged out!');
        navigate('/login');
    };

    // This runs on app load/refresh to check if a token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // In a real production app, this is where you would send the token
        // to a backend verification route (e.g., /api/auth/verify) 
        // to retrieve user details and validate session status.
        if (token) {
            // For now, we only assume validity if token is present
            setIsAuthenticated(true); 
        }
        
        setLoading(false);
        
    }, []);

    const contextValue = {
        user,
        isAuthenticated,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
