import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; 
import stockRoutes from "./routes/stocks.js";
import userRoutes from "./routes/user.js";
import { initWebSocketServer } from "./services/webSocketService.js"; 
import passport from "passport";
import './config/passport.js'
const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// --- ROUTES ---
app.use('/api/auth', authRoutes); 
app.use('/api/stocks',stockRoutes);
app.use('/api/user',userRoutes);
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

  // --- DISABLE MOCK SIMULATION ---
    initWebSocketServer(server); 
    console.log("WebSocket simulation is ON. Serving real data via HTTP polling.");

  })
  .catch(console.error);