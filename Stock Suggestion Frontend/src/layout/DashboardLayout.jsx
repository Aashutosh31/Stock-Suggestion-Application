import React, { useState } from 'react'; // Import useState
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
    // State is now owned by the Layout component
    const [isCollapsed, setIsCollapsed] = useState(false);
    const sidebarWidthClass = isCollapsed ? 'ml-20' : 'ml-64'; // Dynamic margin class

    return (
        <div className="flex min-h-screen">
            {/* Pass state and toggle function to Sidebar */}
            <Sidebar 
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            
            {/* The main content margin is now dynamic, using state for perfect spacing */}
            <main 
                className={`flex-grow p-4 sm:p-8 dark:bg-gray-900 bg-gray-50 transition-all duration-300 ${sidebarWidthClass}`}
            >
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;