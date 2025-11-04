import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

const WebSocketContext = createContext(null);
const WS_URL = 'ws://https://stock-suggestion-app.onrender.com'; 

export const WebSocketProvider = ({ children }) => {
    // State for streaming price updates (keyed by symbol)
    const [realtimeData, setRealtimeData] = useState({});
    // State for the ranked list of stocks from the server
    const [topPicks, setTopPicks] = useState([]); 
    const ws = useRef(null);

    useEffect(() => {
        // Only connect if running in a browser environment
        if (typeof window === 'undefined') return;

        ws.current = new WebSocket(WS_URL);
        
        ws.current.onopen = () => {
            console.log('WebSocket Connected.');
            toast('Live connection established!', { icon: '⚡' });
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'REALTIME_UPDATE') {
                    // Efficiently update the map of latest prices/signals
                    setRealtimeData(prev => ({
                        ...prev,
                        [message.symbol]: {
                            price: message.price,
                            signal: message.signal,
                            change: message.change,
                        }
                    }));
                } 
                
                if (message.type === 'TOP_PICKS') {
                    setTopPicks(message.data);
                }

            } catch (e) {
                console.error('Error parsing WebSocket message:', e, event.data);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket Disconnected. Attempting to reconnect...');
            toast.error('Real-time connection lost. Reconnecting...');
            // Simple exponential backoff retry logic
            setTimeout(() => {
                ws.current = new WebSocket(WS_URL);
            }, 5000); 
        };
        
        ws.current.onerror = (e) => {
             console.error('WebSocket Error:', e);
             toast.error('WebSocket error occurred. Check backend status.');
        }

        // Cleanup function
        return () => {
            ws.current.close();
        };
    }, []);

    const contextValue = {
        realtimeData,
        topPicks,
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);