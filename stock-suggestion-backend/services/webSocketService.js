import { WebSocketServer } from 'wss';

let wss;
// Use the last price from your mock data as the starting point
let lastPrice = 3105.60; 

/**
 * Initializes the WebSocket server and attaches it to the existing HTTP server.
 * @param {http.Server} server - The HTTP server instance from Express.
 */
export const initWebSocketServer = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (wss) => {
        console.log('Client connected to WebSocket');
        
        wss.send(JSON.stringify({ 
            type: 'connection', 
            message: 'WebSocket connection established.' 
        }));

        wss.on('close', () => console.log('Client disconnected'));
        wss.on('error', (error) => console.error('WebSocket Error:', error));
    });

    console.log('WebSocket server initialized.');
    
    // Begin simulating live market ticks
    startPriceSimulator();
};

/**
 * Broadcasts data (JSON-stringified) to all connected clients.
 * @param {object} data - The data object to send.
 */
export const broadcast = (data) => {
    if (!wss) return;

    const jsonData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(jsonData);
        }
    });
};

/**
 * Simulates a new price tick for 'RELIANCE' every 5 seconds.
 */
const simulatePriceTick = () => {
    // 1. Generate a small price change (-0.5% to +0.5%)
    const changePercent = (Math.random() - 0.49) * 0.01; 
    let newPrice = lastPrice * (1 + changePercent);
    newPrice = parseFloat(newPrice.toFixed(2));

    // 2. Simulate a realistic OHLCV tick
    const tickData = {
        symbol: 'RELIANCE',
        date: new Date().toISOString(), // Real-time timestamp
        Open: lastPrice,
        High: parseFloat(Math.max(lastPrice, newPrice, newPrice + (Math.random() * 3)).toFixed(2)),
        Low: parseFloat(Math.min(lastPrice, newPrice, newPrice - (Math.random() * 3)).toFixed(2)),
        Close: newPrice,
        Volume: Math.floor(Math.random() * 10000) + 5000, // Random volume for the tick
    };

    // 3. Update the last price for the next tick
    lastPrice = newPrice;

    // 4. Broadcast the new tick data
    broadcast({
        type: 'stock-update',
        payload: tickData,
    });
};

// Starts the 5-second interval timer for the price simulator
const startPriceSimulator = () => {
    setInterval(simulatePriceTick, 5000);
};