import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Custom Hook to manage Session ID for guests
    const getSessionId = () => {
        let sid = localStorage.getItem('asmaw_session_id');
        if (!sid) {
            sid = 'session_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('asmaw_session_id', sid);
        }
        return sid;
    };

    const fetchCart = async () => {
        try {
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            const res = await api.get('/cart', { headers });
            setCart(res.data.cart);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch cart initially and when user login status changes
    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (productId, variantId, quantity, price) => {
        try {
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            const res = await api.post('/cart/items', {
                product_id: productId,
                variant_id: variantId,
                quantity,
                price
            }, { headers });
            setCart(res.data.cart);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to add item' };
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            const res = await api.put(`/cart/items/${itemId}`, { quantity }, { headers });
            setCart(res.data.cart);
        } catch (error) {
            console.error('Update quantity failed', error);
        }
    };

    const removeItem = async (itemId) => {
        try {
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            const res = await api.delete(`/cart/items/${itemId}`, { headers });
            setCart(res.data.cart);
        } catch (error) {
            console.error('Remove item failed', error);
        }
    };

    const cartTotal = cart?.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
    const cartCount = cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0;

    return (
        <CartContext.Provider value={{
            cart, loading, cartTotal, cartCount,
            addToCart, updateQuantity, removeItem, fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
