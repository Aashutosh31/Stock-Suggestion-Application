import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Note: Replace 'your_jwt_secret' with a strong secret key in a new .env variable.
const jwtSecret = process.env.JWT_SECRET ; 

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
export const registerUser = async (req, res) => {
    // We are expecting: Name, Email, Password, Confirm Password from frontend, 
    // but only need name, email, and password for the database.
    const { name, email, password } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            // Error handling with a clear message
            return res.status(400).json({ msg: 'User already exists' });
        }

        // 2. Create new User instance
        user = new User({
            name,
            email,
            password,
        });

        // 3. Hash password using bcryptjs
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Save user to database
        await user.save();

        // 5. Create and return JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            jwtSecret, // Use the secret defined above
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, msg: "Registration successful" });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. Create and return JWT
        const payload = {
            user: {
                id: user.id,
                name: user.name, // <-- ADD THIS LINE
            },
        };

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user, msg: "Login successful" });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
export const updateProfile = async (req, res) => {
    const { name } = req.body;
    
    // Only update fields that are provided
    const updateFields = {};
    if (name) updateFields.name = name;

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No fields to update' });
    }

    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true } // Return the updated document
        ).select('-password'); // Don't send the password back

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};