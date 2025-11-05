import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const ResetPassword = () => {
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();

    const { password, confirmPassword } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match.');
        }
        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters.');
        }

        setLoading(true);
        try {
            const { data } = await apiClient.post(`/api/auth/reset-password/${token}`, { password });
            toast.success(data.msg);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to reset password.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 dark:bg-gray-900">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-8 space-y-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 text-center py-1">
                    Set New Password
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Please enter your new password.
                </p>

                <form className="space-y-6" onSubmit={onSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={onChange}
                            className="w-full px-4 py-3 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm New Password
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={onChange}
                            className="w-full px-4 py-3 mt-1 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-xl text-lg font-semibold text-white bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Set New Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;