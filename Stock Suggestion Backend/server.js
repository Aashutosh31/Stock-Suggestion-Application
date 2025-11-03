import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; 
import stockRoutes from "./routes/stocks.js";
import { initWebSocketServer } from "./services/webSocketService.js"; // Import the service

const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes); 
app.use('/api/stocks',stockRoutes);
// --------------

app.get("/", (req,res)=>res.send("API is running..."));

// db connect
mongoose.connect(process.env.MONGO_URL)
  .then(()=> {
    console.log("mongo connected");
    
    // --- SERVER & WEBSOCKET INITIALIZATION ---
    // 1. Create the HTTP server from the Express app
    const server = app.listen(process.env.PORT || 5000, ()=> 
        console.log(`API Server running on port ${process.env.PORT || 5000}`)
    );

    // 2. Pass the HTTP server instance to our WebSocket service
    initWebSocketServer(server);

  })
  .catch(console.error);