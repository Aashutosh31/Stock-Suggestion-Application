import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Register from './components/Register.jsx'; 
import Login from './components/Login.jsx'; // Imported the Login component

const App = () => {
  // A dark background for the "modern aesthetic and extraordinary" UI/UX
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Global Toast Notification Container for "god level" user feedback */}
        <Toaster position="top-center" reverseOrder={false} /> 
        
        <Routes>
          {/* Default route for the entry point - set to Login */}
          <Route path="/" element={<Login />} /> 
          <Route path="/register" element={<Register />} />
          {/* Explicit route for Login */}
          <Route path="/login" element={<Login />} /> 
          {/* Dashboard placeholder - Next steps will focus on this */}
          <Route path="/dashboard" element={<div className="text-center pt-20 text-3xl text-cyan-500">Welcome to the Dashboard!</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;