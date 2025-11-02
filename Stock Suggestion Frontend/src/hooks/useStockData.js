import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000'; 

const useStockData = (symbol = 'RELIANCE') => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStocks = async () => {
            // Retrieve JWT token
            const token = localStorage.getItem('token'); 
            
            if (!token) {
                setLoading(false);
                setError('Authentication token missing. Please log in.');
                toast.error('Authentication token missing. Please log in.');
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/stocks/data?symbol=${symbol}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token, // Send the JWT token for protection
                    },
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.msg || 'Failed to fetch stock data.');
                }

                const result = await res.json();
                setData(result);
                setLoading(false);

            } catch (err) {
                setError(err.message);
                setLoading(false);
                toast.error(err.message);
                console.error('Stock data fetch error:', err);
            }
        };

        fetchStocks();
    }, [symbol]);

    return { data, loading, error };
};

export default useStockData;