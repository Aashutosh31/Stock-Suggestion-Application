import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

// --- registerUser, loginUser, updateProfile are unchanged ---

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id, name: user.name } };
        jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user, msg: "Registration successful" });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

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
        const payload = { user: { id: user.id, name: user.name } };
        jwt.sign(payload, jwtSecret, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: payload.user, msg: "Login successful" });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

export const updateProfile = async (req, res) => {
    const { name } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No fields to update' });
    }
    try {
        let user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// --- THIS IS THE FIX ---

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    // We will send this success message NO MATTER WHAT.
    const successMessage = 'If an account with that email exists, a reset link has been sent.';

    try {
        const user = await User.findOne({ email });

        // If no user, send success message and do nothing.
        // This prevents attackers from checking if an email is registered.
        if (!user) {
            return res.status(200).json({ msg: successMessage });
        }

        // --- All database operations are in this try block ---
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;

        // --- NEW INNER TRY/CATCH FOR EMAIL ---
        // This will attempt to send the email.
        // If it fails, it will NOT crash the server.
        try {
            await sendPasswordResetEmail(user.email, resetURL);
        } catch (emailError) {
            // Log the error for you to debug on Render, but don't crash.
            console.error(`--- EMAIL SERVICE FAILED ---`);
            console.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);
            console.error(`--- END EMAIL SERVICE ERROR ---`);
        }
        // --- END INNER TRY/CATCH ---

        // Send the success message REGARDLESS of whether the email sent.
        // This stops the 500 error and fixes the server crash.
        res.status(200).json({ msg: successMessage });

    } catch (dbError) {
        // This will only catch DATABASE errors (like failing to save the token)
        console.error(`Database error during password reset: ${dbError.message}`);
        // Only send 500 for a critical database failure
        res.status(500).send('Server error');
    }
};

// --- END OF FIX ---


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