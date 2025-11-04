import React, { useState } from 'react'; // 'use' was an error, should be useState
import toast from 'react-hot-toast';
import { Link , useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- 1. IMPORT useAuth

// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

const Login = () => {
    // State to hold form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const navigate = useNavigate();
    const { login } = useAuth(); // <-- 2. GET THE login FUNCTION FROM CONTEXT

    const { email, password } = formData;

    const onChange = e => 
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Welcome back, ${data.user.name}!`);
                
                // --- 3. THIS IS THE FIX ---
                // Call the context login function. This will:
                // 1. Save the token to localStorage
                // 2. Set user state
                // 3. Set isAuthenticated = true IMMEDIATELY
                login(data.token, data.user);
                // -------------------------
                
                navigate('/dashboard'); 
            } else {
                toast.error(data.msg || 'Login failed. Please check your details.');
            }
        } catch (err) {
            toast.error('Could not connect to the server.');
            console.error(err);
        }
    };

    const gradientClasses = "bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700";
    const googleButtonClasses = "w-full flex items-center justify-center py-3 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 transition duration-300";


    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md bg-gray-800 shadow-2xl rounded-xl p-8 space-y-8 backdrop-blur-sm bg-opacity-70 border border-gray-700/50 transform transition duration-500 hover:shadow-cyan-500/50">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 text-center py-1 ">
                    Stock App Login
                </h2>
                <p className="text-center text-gray-400">
                    Log in to view your personalized stock suggestions.
                </p>

                <form className="space-y-6" onSubmit={onSubmit}>
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={onChange}
                            className="w-full px-4 py-3 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 placeholder-gray-500 shadow-inner"
                            placeholder="user@example.com"
                        />
                    </div>
                    
                    {/* Password Input */}
                    <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <Link to="#" className="text-sm font-medium text-amber-500 hover:text-amber-400 transition duration-200">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={onChange}
                            className="w-full px-4 py-3 mt-1 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 placeholder-gray-500 shadow-inner"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-xl text-lg font-semibold text-white ${gradientClasses} focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition duration-300 transform hover:scale-[1.01]`}
                    >
                        Log In
                    </button>
                </form>

                {/* (Rest of the file is the same) */}
                <div className="text-center text-sm space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-800 text-gray-400">
                                Or log in with
                            </span>
                        </div>
                    </div>

                    <button
                        className="w-full flex items-center justify-center h-12 gap-3 py-0 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 transition duration-300"
                    >
                       <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 48 48"
                            >
                            <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.7 3.3l6.5-6.5C35.2 2.4 29.9 0 24 0 14.6 0 6.4 5.4 2.4 13.3L9.6 18c2-6.1 7.7-10.5 14.4-10.5z"/>
                            <path fill="#FBBC05" d="M46.5 24c0-1.6-.2-3.2-.5-4.7H24v9.1h12.8c-.6 3.1-2.3 5.7-4.8 7.4l7.5 5.8C43.9 37.6 46.5 31.4 46.5 24z"/>
                            <path fill="#34A853" d="M9.6 30l-7.2 5.7C6.4 42.6 14.6 48 24 48c5.8 0 11.2-2 15.3-5.3l-7.5-5.8c-2.1 1.4-4.9 2.2-7.8 2.2-6.7 0-12.3-4.4-14.4-10.3z"/>
                            <path fill="#4285F4" d="M9.6 18l-7.2-5.7C.9 15.1 0 19.4 0 24c0 4.6.9 8.9 2.4 12.7l7.2-5.7C8.8 28.4 8.5 26.3 8.5 24s.3-4.4 1.1-6z"/>
                        </svg>

                        <span className="select-none align-middle leading-none">Login with Google</span>
                    </button>
                    
                    <p className="text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300 transition duration-200">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;