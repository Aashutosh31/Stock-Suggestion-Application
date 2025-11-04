import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; 
import stockRoutes from "./routes/stocks.js";
import userRoutes from "./routes/user.js"; 
import passport from "passport";
import './config/passport.js';

// --- 1. IMPORT THE CORRECT WS MODULES ---
import { WebSocketServer } from 'ws';
import { handleConnection } from './core/websocket.js';
import { scheduleRealTimeUpdates } from './services/stockService.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// --- ROUTES ---
app.use('/api/auth', authRoutes); 
app.use('/api/stocks', stockRoutes);
app.use('/api/user', userRoutes);

app.get("/", (req,res)=>res.send("API is running..."));

// db connect
mongoose.connect(process.env.MONGO_URL)
  .then(()=> {
    console.log("mongo connected");
    
    const server = app.listen(process.env.PORT || 5000, ()=> 
        console.log(`API Server running on port ${process.env.PORT || 5000}`)
    );

    // --- 2. INITIALIZE THE *NEW* WEBSOCKET SERVER ---
    const wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
        handleConnection(ws); // Use the handler from core/websocket.js
    });

    // Start the real-time scheduler from stockService
    scheduleRealTimeUpdates(); 
    
    console.log("✅ Real-time WebSocket service initialized.");

  })
  .catch(console.error);