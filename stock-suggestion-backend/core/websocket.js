import { WebSocket } from 'ws';

// Set to hold all connected WebSocket clients
const clients = new Set();

// Placeholder for scheduling the service function (avoids circular dependency)
let realTimeScheduler = null; 

export const setRealTimeScheduler = (schedulerFn) => {
    realTimeScheduler = schedulerFn;
};

/**
 * Handles a new WebSocket connection, adds the client to the set, 
 * and initiates the real-time update schedule if it's the first client.
 */
export const handleConnection = (ws) => {
    clients.add(ws);
    console.log(`New WebSocket client connected. Total clients: ${clients.size}`);
    
    // Start the periodic data push when the first client connects
    if (clients.size === 1 && realTimeScheduler) {
        realTimeScheduler(clients);
    }

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`Client disconnected. Total clients: ${clients.size}`);
    });
    
    // Basic error handling
    ws.on('error', (err) => {
        console.error('WebSocket Error:', err.message);
        clients.delete(ws);
    });
};

/**
 * Sends data to all connected clients.
 * @param {object} data - The data payload to send.
 */
export const broadcast = (data) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        // Ensure the connection is open before sending
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};