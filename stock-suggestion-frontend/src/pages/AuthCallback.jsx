import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Use the login function from AuthContext
        login(token, user);
        
        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard');
      } catch (e) {
        toast.error('Login failed during callback.');
        navigate('/login');
      }
    } else {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  // Show a loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 text-xl text-cyan-400">
      Verifying your login...
    </div>
  );
};

export default AuthCallback;