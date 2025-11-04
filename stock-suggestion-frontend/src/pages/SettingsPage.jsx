import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// --- Mutation Function ---
const updateProfile = (name) => apiClient.put('/api/auth/profile', { name });

const SettingsPage = () => {
    const { user, login } = useAuth(); // Get user and login (to update context)
    const { theme, toggleTheme } = useTheme();
    const [name, setName] = useState(user?.name || '');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (data) => {
            toast.success('Profile updated!');
            // Update the user in AuthContext
            const updatedUser = { ...user, name: data.data.name };
            const token = localStorage.getItem('token');
            login(token, updatedUser);
            // Invalidate queries that depend on user data
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: () => toast.error('Failed to update profile.'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(name);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 p-6 max-w-2xl mx-auto">
                <h1 className="text-3xl font-extrabold dark:text-white text-gray-900">
                    Settings
                </h1>

                {/* Profile Settings */}
                <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-white p-6 rounded-xl shadow-lg border dark:border-gray-700 space-y-4">
                    <h2 className="text-2xl font-bold dark:text-white">Profile</h2>
                    
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-400">Email (Read-only)</label>
                        <input
                            type="email"
                            value={user?.email || 'Loading...'}
                            disabled
                            className="w-full px-4 py-3 mt-1 dark:text-gray-400 dark:bg-gray-700 bg-gray-200 border dark:border-gray-600 rounded-lg"
                        />
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium dark:text-gray-400">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 mt-1 dark:text-white dark:bg-gray-700 bg-white border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={mutation.isLoading}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {mutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                {/* Display Settings */}
                <div className="dark:bg-gray-800 bg-white p-6 rounded-xl shadow-lg border dark:border-gray-700 space-y-4">
                    <h2 className="text-2xl font-bold dark:text-white">Display</h2>
                    <div className="flex justify-between items-center">
                        <span className="dark:text-gray-300">Theme</span>
                        <button
                            onClick={toggleTheme}
                            className="px-6 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700"
                        >
                            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;