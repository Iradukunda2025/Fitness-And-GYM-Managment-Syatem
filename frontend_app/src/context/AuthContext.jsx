import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gym_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gym_auth_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const currentToken = localStorage.getItem('gym_auth_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('gym_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      // If invalid token, clear
      if (err.response && err.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('gym_auth_token', access_token);
    localStorage.setItem('gym_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/register', formData);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('gym_auth_token', access_token);
    localStorage.setItem('gym_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('gym_auth_token');
      localStorage.removeItem('gym_user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role,
        isAdmin: user?.role === 'admin',
        isTrainer: user?.role === 'trainer',
        isMember: user?.role === 'member',
        login,
        register,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
