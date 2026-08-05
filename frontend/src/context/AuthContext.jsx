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

            // API merge requires token! Set it first!
            localStorage.setItem('asmaw_token', token);
            localStorage.setItem('asmaw_user', JSON.stringify(user));
            setUser(user);

            // Execute Cart merge async in background, DO NOT AWAIT to unblock Login UI!
            const sessionId = localStorage.getItem('asmaw_session_id');
            if (sessionId) {
                api.post('/cart/merge', { session_id: sessionId }, { headers: { Authorization: `Bearer ${token}` } })
                    .catch(e => console.error('Lỗi ngầm khi merge giỏ hàng:', e));
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Đăng nhập thất bại',
                requires_verification: error.response?.data?.requires_verification
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);

            if (response.data.requires_verification) {
                return { success: true, requires_verification: true, email: userData.email };
            }

            // (Phòng hờ nếu API trả token)
            const { user, token } = response.data;
            if (token) {
                const sessionId = localStorage.getItem('asmaw_session_id');
                if (sessionId) {
                    localStorage.setItem('asmaw_token', token);
                    api.post('/cart/merge', { session_id: sessionId }, { headers: { Authorization: `Bearer ${token}` } })
                        .catch(e => console.error('Lỗi ngầm khi merge:', e));
                } else {
                    localStorage.setItem('asmaw_token', token);
                }
                localStorage.setItem('asmaw_user', JSON.stringify(user));
                setUser(user);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Đăng ký thất bại.', errors: error.response?.data?.errors };
        }
    };

    const logout = () => {
        localStorage.removeItem('asmaw_token');
        localStorage.removeItem('asmaw_user');
        localStorage.removeItem('asmaw_wishlist');
        localStorage.removeItem('asmaw_session_id');
        setUser(null);
        window.location.href = '/login';
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
