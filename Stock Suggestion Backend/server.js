import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import authRoutes from "./routes/auth.js"; // Import the new route
import stockRoutes from "./routes/stocks.js"

const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes); // Use the authentication routes
app.use('/api/stocks',stockRoutes);
// --------------

app.get("/", (req,res)=>res.send("API is running..."));

// db connect
mongoose.connect(process.env.MONGO_URL)
  .then(()=> {
    console.log("mongo connected");
    app.listen(process.env.PORT || 5000, ()=> console.log("server running"));
  })
  .catch(console.error);