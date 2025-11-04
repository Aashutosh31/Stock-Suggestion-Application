import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

// Utility function to get the preferred theme from localStorage or default to 'dark'
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  // Default to dark theme for a modern aesthetic
  return 'dark'; 
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // This is crucial for Tailwind CSS: it applies 'dark' or 'light' class to the <html> tag
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context easily
export const useTheme = () => useContext(ThemeContext);