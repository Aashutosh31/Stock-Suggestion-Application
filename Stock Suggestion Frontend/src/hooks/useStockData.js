import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient'; // Import our new API client
import { useAuth } from '../context/AuthContext';

// This is the actual fetcher function
const fetchStockData = async (symbol) => {
    // The apiClient will automatically add the 'x-auth-token' header
    const { data } = await apiClient.get(`/api/stocks/data?symbol=${symbol}`);
    return data;
};

const useStockData = (symbol = 'RELIANCE') => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        // 1. queryKey: Must be an array. It uniquely identifies this query.
        //    We include 'symbol' so it re-fetches if the symbol changes.
        queryKey: ['stockData', symbol], 
        
        // 2. queryFn: The async function that fetches the data.
        queryFn: () => fetchStockData(symbol),

        // 3. Configuration
        enabled: !!isAuthenticated, // Only run the query if the user is authenticated
        staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
        refetchOnWindowFocus: false, // Optional: disable re-fetch on window focus
    });
};

export default useStockData;