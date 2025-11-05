import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = {
            user: {
                id: user.id,
                name: user.name,
            },
        };

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user, msg: "Registration successful" });
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
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                name: user.name,
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

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
export const updateProfile = async (req, res) => {
    const { name } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No fields to update' });
    }

    try {
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true } 
        ).select('-password'); 

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;

        // Try to send the email
        await sendPasswordResetEmail(user.email, resetURL);
        
        res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });

    } catch (err) {
        console.error(err.message);
        // Do not reveal if email failed or not, just send the generic response
        res.status(200).json({ msg: 'If an account with that email exists, a reset link has been sent.' });
    }
};

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password has been reset successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};