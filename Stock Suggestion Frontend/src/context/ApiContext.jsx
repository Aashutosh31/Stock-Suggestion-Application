import React, { createContext, useState, useContext } from 'react';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
    // NOTE: This MUST be replaced with your actual API key for live data.
    const [apiKey] = useState('Q7OQVZRA47GHFK7A'); 
    
    // Base URL for the conceptual external financial API 
    // (e.g., Alpha Vantage, or you could use a backend wrapper service URL here)
    const [apiUrl] = useState('https://www.alphavantage.co/query'); 

    return (
        <ApiContext.Provider value={{ apiKey, apiUrl }}>
            {children}
        </ApiContext.Provider>
    );
};

export const useApi = () => useContext(ApiContext);