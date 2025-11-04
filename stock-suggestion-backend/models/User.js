// In Stock Suggestion Backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    googleId: { // <-- ADD THIS
        type: String,
        unique: true,
        sparse: true // Allows multiple null values (for non-Google users)
    },
    password: { // <-- MAKE OPTIONAL
        type: String,
        required: false, // Not required if using Google
    },
    watchlist: {
        type: [String], // An array of stock symbols
        default: [],
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', UserSchema);
export default User;