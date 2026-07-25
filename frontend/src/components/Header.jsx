import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, User, Heart, Search, LogOut } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="header" style={{
            position: 'sticky', top: 0, zIndex: 100,
            backgroundColor: '#fff',
            borderBottom: '1px solid #eaeaea',
            height: '80px',
            display: 'flex', alignItems: 'center'
        }}>
            <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link to="/" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2rem',
                    fontWeight: 'normal',
                    letterSpacing: '3px',
                    color: '#111',
                    textDecoration: 'none'
                }}>
                    ASMAW
                </Link>

                {/* Navigation */}
                <nav style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    <Link to="/products?has_sale=1" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#8a6e3e'} onMouseOut={e => e.currentTarget.style.color = '#111'}>Sale</Link>
                    <Link to="/products" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#8a6e3e'} onMouseOut={e => e.currentTarget.style.color = '#111'}>Bộ sưu tập</Link>
                    <Link to="/products?category_id=2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#8a6e3e'} onMouseOut={e => e.currentTarget.style.color = '#111'}>Nam</Link>
                    <Link to="/products?category_id=4" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#8a6e3e'} onMouseOut={e => e.currentTarget.style.color = '#111'}>Nữ</Link>
                    <Link to="/news" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#8a6e3e'} onMouseOut={e => e.currentTarget.style.color = '#111'}>Tin tức</Link>
                </nav>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                        }
                    }} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #111', paddingBottom: '2px', marginRight: '0.5rem' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm..."
                            style={{
                                width: '120px',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '0.85rem',
                                color: '#111',
                                transition: 'width 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.width = '180px'}
                            onBlur={(e) => {
                                if (!searchQuery) e.target.style.width = '120px';
                            }}
                        />
                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Search size={18} strokeWidth={1.5} />
                        </button>
                    </form>

                    <Link to="/cart" style={{ position: 'relative', color: '#111', display: 'flex', alignItems: 'center' }}>
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-4px', right: '-6px',
                                background: '#111', color: '#fff',
                                fontSize: '0.6rem', fontWeight: 'bold',
                                width: '16px', height: '16px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    <Link to="/wishlist" style={{ position: 'relative', color: '#111', display: 'flex', alignItems: 'center' }}>
                        <Heart size={20} strokeWidth={1.5} />
                        {wishlistCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-4px', right: '-6px',
                                background: '#ca8a04', color: '#fff',
                                fontSize: '0.6rem', fontWeight: 'bold',
                                width: '16px', height: '16px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title={user?.name}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                                </div>
                            </Link>

                            {['admin', 'staff', 'shipper'].includes(user.role) && (
                                <Link to={
                                    user.role === 'admin' ? '/admin' :
                                        user.role === 'staff' ? '/staff' : '/shipper'
                                } style={{ color: '#8a6e3e', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none' }}>
                                    Quản trị
                                </Link>
                            )}

                            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }} title="Đăng xuất">
                                <LogOut size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" style={{ color: '#111', display: 'flex', alignItems: 'center' }}>
                            <User size={20} strokeWidth={1.5} />
                        </Link>
                    )}
                </div>
            </div>

        </header>
    );
};

export default Header;
