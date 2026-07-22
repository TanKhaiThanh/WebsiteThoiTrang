import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('asmaw_user');
        const token = localStorage.getItem('asmaw_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;

            localStorage.setItem('asmaw_token', token);
            localStorage.setItem('asmaw_user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { user, token } = response.data;

            localStorage.setItem('asmaw_token', token);
            localStorage.setItem('asmaw_user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, errors: error.response?.data?.errors };
        }
    };

    const logout = () => {
        localStorage.removeItem('asmaw_token');
        localStorage.removeItem('asmaw_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const getDefaultRoute = (role) => {
    switch (role) {
        case 'admin': return '/admin';
        case 'staff': return '/staff';
        case 'shipper': return '/shipper';
        default: return '/';
    }
};

export const useAuth = () => useContext(AuthContext);
