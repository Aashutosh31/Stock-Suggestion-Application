import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>res.send("API is running..."));

// db connect
mongoose.connect(process.env.MONGO_URL)
  .then(()=> {
    console.log("mongo connected");
    app.listen(process.env.PORT || 5000, ()=> console.log("server running"));
  })
  .catch(console.error);
