import React, { useState } from 'react'; // Import useState
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

// Simple Icons (Added Menu icon for the toggle button)
const Icons = {
    Dashboard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7-5.1 5.2"/></svg>,
    Trends: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 14h-2V7h2m2 16H9v-2h6v2M18 10V6H6v4m14-4V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4"/></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 00-2 2v.44a2 2 0 002 2h.44a2 2 0 002-2V4a2 2 0 00-2-2zM12 22a10 10 0 100-20 10 10 0 000 20z"/></svg>,
    Analysis: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5l-2.4 2.4-1.2-1.2-2.4 2.4-1.2-1.2-2.4 2.4L3 11.5v9h9"/></svg>,
    Moon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
    Sun: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    Menu: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    LogOut: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: Icons.Dashboard },
    { name: 'Trends Analysis', to: '/trends', icon: Icons.Trends },
    { name: 'Sections', to: '/sections', icon: Icons.Analysis },
    { name: 'Settings', to: '/settings', icon: Icons.Settings },
];

const Sidebar = ({ isCollapsed, toggleCollapse }) => { 
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        // ... (Logout logic remains the same)
        localStorage.removeItem('token');
        toast.success('Successfully logged out!');
        navigate('/login');
    };

    // --- Dynamic Tailwind Classes ---
    const sidebarBg = 'dark:bg-gray-800 bg-white border-r dark:border-gray-700 border-gray-200';
    
    // Dynamic width class: 64 for expanded, 20 for collapsed
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64'; 
    const logoText = "StockSuggest";
    const gradientLogo = "text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500";
    
    // Class for the link content (text/icon) to show/hide the text
    // Note: Use 'group' and conditional text rendering for better styling
    const linkTextClass = `transition-opacity duration-300 ${isCollapsed ? 'opacity-0 absolute left-full whitespace-nowrap' : 'opacity-100 ml-3'}`;

    const linkClasses = ({ isActive }) =>
        `flex items-center justify-start relative p-3 rounded-lg transition-all duration-300 group ${
            isCollapsed ? 'justify-center' : ''
        } ${
            isActive 
                ? 'dark:bg-blue-600 bg-blue-100 dark:text-white text-blue-600 font-semibold shadow-lg shadow-blue-500/50' 
                : 'dark:text-gray-300 text-gray-700 hover:dark:bg-gray-700 hover:bg-gray-100 hover:dark:text-white'
        }`;

    const ThemeIcon = theme === 'dark' ? Icons.Sun : Icons.Moon;
    const themeButtonClasses = 'p-3 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

    return (
        // Apply the dynamic width class
        <div className={`flex flex-col h-full fixed top-0 left-0 ${sidebarBg} shadow-xl z-10 p-4 transition-all duration-300 ${sidebarWidth}`}>
            
            {/* Logo and Toggle Button */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 mb-6`}>
                {/* Logo visible only when not collapsed */}
                {!isCollapsed && (
                    <span className={gradientLogo}>{logoText}</span>
                )}
                {/* Toggle Button: uses prop function */}
                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-full dark:hover:bg-gray-700 hover:bg-gray-100 dark:text-white text-gray-800"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Icons.Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-grow space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.to}
                        className={linkClasses}
                        end
                    >
                        <item.icon className="w-5 h-5" />
                        <span className={linkTextClass}>
                            {item.name}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions: Theme Toggle and Logout */}
            <div className="mt-auto space-y-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} ${themeButtonClasses} ${
                        theme === 'dark' 
                        ? 'dark:bg-gray-700 text-yellow-300 hover:bg-gray-600 dark:ring-offset-gray-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 ring-offset-white'
                    }`}
                    title="Toggle Theme"
                >
                    <ThemeIcon className="w-6 h-6" />
                    {!isCollapsed && (
                        <span className="ml-3 transition-opacity duration-300">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    )}
                </button>

                {/* Log Out Button */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} p-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                    title="Log Out"
                >
                    <Icons.LogOut className="w-5 h-5" />
                    {!isCollapsed && (
                        <span className="ml-3 transition-opacity duration-300">Log Out</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;