import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('asmaw_wishlist');
        if (stored) {
            try {
                setWishlist(JSON.parse(stored));
            } catch (e) {
                console.error("Invalid wishlist data");
            }
        }
    }, []);

    const toggleWishlist = (product) => {
        setWishlist(prev => {
            const exists = prev.find(item => item.id === product.id);
            let nextWishlist;

            if (exists) {
                nextWishlist = prev.filter(item => item.id !== product.id);
                toast.success('Đã gỡ khỏi Danh sách yêu thích');
            } else {
                nextWishlist = [...prev, product];
                toast.success('Đã lưu vào Danh sách yêu thích');
            }

            localStorage.setItem('asmaw_wishlist', JSON.stringify(nextWishlist));
            return nextWishlist;
        });
    };

    const isWishlisted = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    const wishlistCount = wishlist.length;

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, wishlistCount }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
