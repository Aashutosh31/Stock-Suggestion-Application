import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config()

// Note: Ensure this secret matches the one in authController.js
const jwtSecret = process.env.JWT_SECRET;

export const protect = (req, res, next) => {
    // Get token from header: expected as 'x-auth-token'
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user info (ID) to the request object
        req.user = decoded.user;
        next();
    } catch (err) {
        // This catches expired or invalid tokens
        res.status(401).json({ msg: 'Token is not valid' });
    }
};