import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext'; // We'll use this for the mobile header

// A simple Icon for the mobile menu
const Icons = {
    Menu: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const DashboardLayout = ({ children }) => {
    // This state is now for the *desktop* sidebar collapse
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // --- 1. ADD NEW STATE FOR MOBILE MENU ---
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user } = useAuth(); // Get user to display name

    // 2. DYNAMIC MARGIN FOR MAIN CONTENT
    // On mobile (smaller than md), margin is 0.
    // On desktop (md and up), margin matches the sidebar state.
    const sidebarWidthClass = isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64';

    return (
        <div className="flex min-h-screen">
            {/* --- 3. PASS ALL STATE PROPS TO THE SIDEBAR --- */}
            <Sidebar 
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen} // Pass the setter
            />
            
            <div className={`flex-grow dark:bg-gray-900 bg-gray-50 transition-all duration-300 ${sidebarWidthClass}`}>
                
                {/* --- 4. ADD MOBILE-ONLY HEADER --- */}
                <header className="md:hidden sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
                    <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
                        StockSuggest
                    </span>
                    <button onClick={() => setIsMobileOpen(true)} className="dark:text-white">
                        <Icons.Menu className="w-6 h-6" />
                    </button>
                </header>
                
                {/* --- 5. RENDER THE PAGE CONTENT --- */}
                {/* Add padding-top on mobile to account for the sticky header */}
                <main className="p-4 sm:p-8 md:pt-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;