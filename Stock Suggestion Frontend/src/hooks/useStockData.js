import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient'; 
import { useAuth } from '../context/AuthContext';

// This is the actual fetcher function
const fetchStockData = async (symbol) => {
    // We call our secure, real-data proxy route.
    const { data } = await apiClient.get(`/api/stocks/real/${symbol}`);
    return data;
};

const useStockData = (symbol) => { 
    const { isAuthenticated } = useAuth();

    return useQuery({
        // 1. queryKey: Must be an array.
        queryKey: ['stockData', symbol], 
        
        // 2. queryFn: The async function that fetches the data.
        queryFn: () => fetchStockData(symbol),

        // 3. Configuration
        //    The query will *not* run if symbol is unauthenticated or undefined.
        enabled: !!isAuthenticated && !!symbol, 
        
        staleTime: 1000 * 60 * 15, // Cache real data for 15 minutes
        refetchOnWindowFocus: false, 
    });
};

export default useStockData;