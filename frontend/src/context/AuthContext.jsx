import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { initializeSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state when the app loads
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);

        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          initializeSocket(parsedUser.id);
        } catch (e) {
          console.warn('Socket init failed during restore', e.message);
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);

      // Clear corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      // Validate API response
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Login failed');
      }

      const { token, ...userData } = response.data.data;

      if (!token) {
        throw new Error('Token not received from server');
      }

      // Normalize user object for backward compatibility (provide `username`)
      const normalizedUser = { ...userData, username: userData.name || userData.username };

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      // Set axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Update React state
      setUser(normalizedUser);

      // Initialize socket connection for real-time events
      try {
        initializeSocket(userData.id);
      } catch (e) {
        console.warn('Socket init failed on login', e.message);
      }

      // Show success message
      toast.success('Login successful! Welcome back.');

      // IMPORTANT: return true so Login.jsx can navigate
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);

      const message =
        error.response?.data?.message || error.message || 'Login failed. Please check credentials.';

      toast.error(message);

      // Ensure failed login does not leave stale data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);

      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    try {
      disconnectSocket();
    } catch (e) {
      console.warn('Socket disconnect failed', e?.message || e);
    }
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthContext;
