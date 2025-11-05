import sgMail from '@sendgrid/mail';
import 'dotenv/config';

// 1. Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 2. Create the reusable function
export const sendPasswordResetEmail = async (toEmail, resetURL) => {
    
    const msg = {
        to: toEmail, // The user's email
        from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender email
        subject: 'Your Password Reset Link',
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
        await sgMail.send(msg);
        console.log(`Password reset email sent to ${toEmail} via SendGrid`);
    } catch (error) {
        console.error(`--- SENDGRID ERROR ---`);
        console.error(`Error sending SendGrid email: ${error.message}`);
        
        // Log more details if available (e.g., "permission denied")
        if (error.response) {
            console.error(JSON.stringify(error.response.body, null, 2));
        }
        console.error(`--- END SENDGRID ERROR ---`);
        
        throw new Error('Email could not be sent.');
    }
};