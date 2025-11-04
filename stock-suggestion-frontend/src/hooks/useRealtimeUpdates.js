import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// --- THIS IS THE FIX ---
// REMOVE the hardcoded, incorrect URL:
// const WS_URL = 'ws://https://stock-suggestion-app.onrender.com';
//
// ADD the correct environment variable:
const WS_URL = import.meta.env.VITE_WS_URL;
// --- END FIX ---

/**
 * Custom hook to connect to the stock WebSocket server
 * and update react-query cache with live data.
 */
export const useRealtimeUpdates = () => {
    const queryClient = useQueryClient();
    const ws = useRef(null); // Ref to hold the WebSocket instance

    useEffect(() => {
        // Prevent re-connection if one already exists
        if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
            return;
        }

        // --- This will now use the correct "wss://..." URL ---
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
            console.log('WebSocket Connected.');
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Listen for our specific 'stock-update' message type
            if (message.type === 'stock-update') {
                const tick = message.payload; // This is our OHLCV data
                
                // This is the core logic:
                // We find the query cache for this stock and update it.
                queryClient.setQueryData(['stockData', tick.symbol], (oldData) => {
                    // If the cache is empty, don't do anything
                    if (!oldData) return;

                    // --- Real-time Chart Update Logic ---
                    // This simulation updates the *last* data point.
                    // A production chart would append, but this demonstrates the real-time update.
                    
                    const newChartData = [...oldData.data];
                    const lastDataPointIndex = newChartData.length - 1;

                    // Update the last bar with the new live tick info
                    newChartData[lastDataPointIndex] = {
                        ...newChartData[lastDataPointIndex], // Keep old data
                        date: "Live", // Change label to show it's live
                        Close: tick.Close,
                        Open: tick.Open,
                        High: tick.High,
                        Low: tick.Low,
                        Volume: (newChartData[lastDataPointIndex].Volume || 0) + tick.Volume, // Accumulate volume
                    };

                    // Also update the AI analysis block
                    const newAiAnalysis = {
                        ...oldData.ai_analysis,
                        latest_price: tick.Close,
                        // Simple trend update based on tick
                        trend: tick.Close > tick.Open ? "Live Uptick" : "Live Downtick",
                    };
                    
                    // Return the new state for react-query
                    return {
                        ...oldData,
                        data: newChartData,
                        ai_analysis: newAiAnalysis,
                    };
                });
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket Disconnected.');
            // Production: Implement reconnection logic here
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
            toast.error('Real-time connection error.');
        };

        // Cleanup: Close WebSocket connection when component unmounts
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [queryClient]); // Dependency array
};