import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';

// Our MERN Backend URL
const MERN_API_BASE_URL = 'http://localhost:5000'; 

// Function to handle exponential backoff for API calls (Production practice)
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) { 
                throw new Error('Rate limit exceeded. Retrying...', { status: 429 });
            }
            if (!response.ok) {
                 const errorBody = await response.json().catch(() => ({ msg: response.statusText }));
                 throw new Error(errorBody.msg || response.statusText, { status: response.status });
            }
            return response;
        } catch (error) {
            if (i < retries - 1 && error.message.includes('Rate limit')) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};


const useStockData = (symbol = 'RELIANCE') => {
    // 1. ALL HOOKS MUST BE CALLED FIRST AND UNCONDITIONALLY
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { apiKey, apiUrl } = useApi();
    const { isAuthenticated } = useAuth();
    
    // 2. We use the boolean isAuthenticated instead of the entire array 
    // to cleanly handle dependencies. The other static values (apiKey, apiUrl)
    // are included in the dependency array as they define the API layer configuration.
    useEffect(() => {
        if (!isAuthenticated) {
             setLoading(false);
             setError('Authentication required to fetch data.');
             return;
        }

        const fetchStocks = async () => {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token'); 
            
            if (!token) {
                setError('Authentication token missing.');
                setLoading(false);
                // Prompt user to log in via toast
                toast.error('Session expired or token missing. Please log in.');
                return;
            }

            // --- ATTEMPT 1: FETCH FROM PROTECTED MERN BACKEND (Primary Source) ---
            try {
                const res = await fetchWithRetry(`${MERN_API_BASE_URL}/api/stocks/data?symbol=${symbol}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token, 
                    },
                });

                const result = await res.json();
                
                toast.success(`Data for ${symbol} loaded successfully.`);
                
                setData(result);
                setError(null);
                setLoading(false);
                return; 
                
            } catch (err) {
                 console.error('MERN Backend API Error:', err.message);
                 setError(`MERN Backend Error: ${err.message}. Trying external API...`);
            }
            
            // --- ATTEMPT 2: FETCH FROM EXTERNAL API (Real-Time Readiness) ---
            if (apiKey && apiKey !== 'YOUR_PRODUCTION_ALPHA_VANTAGE_API_KEY') {
                 toast('MERN failed. Attempting to fetch live data from Alpha Vantage...', { icon: '📡' });
                 
                 const realApiUrl = `${apiUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

                 try {
                     const externalRes = await fetch(realApiUrl);
                     const externalData = await externalRes.json();
                     
                     if (externalData['Error Message'] || externalData['Note'] || !externalRes.ok) {
                          throw new Error(externalData['Error Message'] || externalData['Note'] || 'External API Error. Check key/rate limits.');
                     }
                     
                     toast.success('Live data fetch successful! (Requires data transformation)');
                     setError(null);
                     // setData(transformData(externalData)); // Placeholder for transformation
                     
                 } catch (externalErr) {
                     toast.error(`External Data Error: ${externalErr.message}`);
                     setError(`External Data Error: ${externalErr.message}`);
                 }
            }
            
            // Final State Update
            setLoading(false);
        };

        fetchStocks();
    // 3. CORRECT DEPENDENCY ARRAY: Ensure all non-static variables used inside 
    // the effect are included, and no complex objects that change reference every render.
    }, [symbol, apiKey, apiUrl, isAuthenticated]); 

    return { data, loading, error };
};

export default useStockData;
