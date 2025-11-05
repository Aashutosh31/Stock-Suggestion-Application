import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { data } = await apiClient.post('/api/auth/forgot-password', { email });
            setMessage(data.msg); // "If an account exists..."
            toast.success(data.msg);
        } catch (err) {
            toast.error('Could not connect to the server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 dark:bg-gray-900">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-8 space-y-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 text-center py-1">
                    Reset Password
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Enter your email and we'll send you a link to reset your password.
                </p>

                <form className="space-y-6" onSubmit={onSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                            placeholder="user@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-xl text-lg font-semibold text-white bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                {message && (
                    <p className="text-center text-green-500">{message}</p>
                )}

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Remembered your password?{' '}
                    <Link to="/login" className="font-medium text-cyan-500 hover:text-cyan-400">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;