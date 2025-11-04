import React, { createContext, useState, useContext } from 'react';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
    // Base URL for the conceptual external financial API 
    // (e.g., Alpha Vantage, or you could use a backend wrapper service URL here)
    const [apiUrl] = useState('https://eodhistoricaldata.com'); 

    return (
        <ApiContext.Provider value={{ apiUrl }}>
            {children}
        </ApiContext.Provider>
    );
};

export const useApi = () => useContext(ApiContext);