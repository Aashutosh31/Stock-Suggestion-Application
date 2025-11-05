import nodemailer from 'nodemailer';
import 'dotenv/config';

// 1. Create a "transporter" - this is the object that can send email
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_PASS, // your-app-password
    },
});

// 2. Create a reusable function to send the email
export const sendPasswordResetEmail = async (toEmail, resetURL) => {
    const mailOptions = {
        from: `"StockSuggest" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Your Password Reset Link',
        // We send both a plain text and HTML version for email clients
        text: `You requested a password reset. Click this link to reset your password: ${resetURL}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your StockSuggest account.</p>
                <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
                <a href="${resetURL}" style="background-color: #0d9488; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        // We throw the error so the controller can handle it
        throw new Error('Email could not be sent.');
    }
};