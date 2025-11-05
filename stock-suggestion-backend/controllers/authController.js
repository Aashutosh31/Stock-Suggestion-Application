import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

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
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // For security, don't reveal that the user doesn't exist
            return res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Create a reset token (valid for 1 hour)
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Create the reset URL
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;

        // --- DEVELOPMENT ONLY ---
        // In production, you would email this link.
        // For now, we log it to the console.
        console.log('PASSWORD RESET LINK (Copy/Paste this into your browser):');
        console.log(resetURL);
        // --- END DEVELOPMENT ---

        res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// --- 3. ADD THE resetPassword FUNCTION ---
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        // Find user by token AND check if it's not expired
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }

        // Set the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Clear the token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password has been reset successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};