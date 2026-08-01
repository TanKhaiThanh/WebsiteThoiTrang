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

    const rehydrateCart = async (rawCart) => {
        if (!rawCart || !rawCart.items?.length) return rawCart;
        const productIds = [...new Set(rawCart.items.map(i => i.product_id))].join(',');
        try {
            const prodRes = await api.get(`/products?ids=${productIds}`);
            const productsDict = prodRes.data.data.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
            rawCart.items = rawCart.items.map(item => ({
                ...item,
                product_details: productsDict[item.product_id] || null
            }));
        } catch (e) {
            console.error('Failed to rehydrate cart items');
        }
        return rawCart;
    };

    const fetchCart = async () => {
        try {
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            const res = await api.get('/cart', { headers });
            setCart(await rehydrateCart(res.data.cart));
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

    const addToCart = async (productId, variantId, quantity, price, productData = null) => {
        try {
            // OPTIMISTIC UI: Cập nhật Giỏ Hàng trên màn hình ngay tắp lự
            setCart(prev => {
                const newCart = prev ? { ...prev, items: [...(prev.items || [])] } : { items: [] };
                const existing = newCart.items.findIndex(i => i.product_id === productId && i.variant_id === variantId);

                let details = null;
                if (productData) {
                    details = {
                        name: productData.name,
                        images: productData.images, // Để load hình Thumbnail
                        primary_image: productData.images && productData.images.length > 0 ? productData.images[0] : null,
                        variants: productData.variants // Để component Cart load đc Color và Size
                    };
                }

                if (existing >= 0) {
                    newCart.items[existing].quantity += quantity;
                    if (details) newCart.items[existing].product_details = details;
                } else {
                    newCart.items.push({
                        id: 'temp_' + Date.now(),
                        product_id: productId,
                        variant_id: variantId,
                        quantity,
                        price,
                        product_details: details
                    });
                }
                return newCart;
            });

            // Ghi ngầm xuống Backend, KHÔNG AWAIT để giải phóng UI
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            api.post('/cart/items', {
                product_id: productId,
                variant_id: variantId,
                quantity,
                price
            }, { headers }).then(async (res) => {
                setCart(await rehydrateCart(res.data.cart)); // Sync accurate DB values sau
            }).catch(e => {
                console.error('Lỗi khi lưu giỏ hàng ngầm:', e);
                fetchCart(); // Rollback nếu lỗi
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to add item' };
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return;
        const originalCart = { ...cart, items: cart.items.map(i => ({ ...i })) };

        try {
            // OPTIMISTIC UI: Phản hồi tăng giảm số lượng tức thời
            setCart(prev => {
                if (!prev || !prev.items) return prev;
                return {
                    ...prev,
                    items: prev.items.map(item => item.id === itemId ? { ...item, quantity } : item)
                };
            });

            // Chạy ngầm API
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            api.put(`/cart/items/${itemId}`, { quantity }, { headers })
                .then(async (res) => {
                    setCart(await rehydrateCart(res.data.cart));
                })
                .catch(e => {
                    console.error('Update quantity failed', e);
                    setCart(originalCart); // Rollback
                });
        } catch (error) {
            console.error('Update quantity logic error', error);
            setCart(originalCart);
        }
    };

    const removeItem = async (itemId) => {
        const originalCart = { ...cart, items: cart.items.map(i => ({ ...i })) };
        // OPTIMISTIC UI: Xóa khỏi màn hình ngay lập tức
        setCart(prev => {
            if (!prev || !prev.items) return prev;
            return { ...prev, items: prev.items.filter(item => item.id !== itemId) };
        });

        try {
            // Chạy ngầm lệnh xóa ở Database
            const headers = !user ? { 'X-Session-ID': getSessionId() } : {};
            api.delete(`/cart/items/${itemId}`, { headers })
                .then(async (res) => {
                    setCart(await rehydrateCart(res.data.cart));
                })
                .catch(e => {
                    console.error('Remove item failed', e);
                    setCart(originalCart); // Rollback
                });
        } catch (error) {
            console.error('Remove item local logic failed', error);
            setCart(originalCart);
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
