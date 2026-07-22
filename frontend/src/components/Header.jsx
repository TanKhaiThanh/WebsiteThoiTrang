import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, User, LogOut, Menu } from 'lucide-react';

const Header = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header" style={{
            position: 'sticky', top: 0, zIndex: 100,
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            height: 'var(--header-height)',
            display: 'flex', alignItems: 'center'
        }}>
            <div className="container flex items-center justify-between">

                {/* Logo */}
                <Link to="/" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2rem',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    color: 'var(--color-primary)'
                }}>
                    ASMAW
                </Link>

                {/* Navigation */}
                <nav className="flex gap-4" style={{ display: 'none' }} /* Add media queries later */>
                    <Link to="/products" style={{ fontWeight: 500 }}>Bộ Sưu Tập</Link>
                    <Link to="/products?category=nam" style={{ fontWeight: 500 }}>Nam</Link>
                    <Link to="/products?category=nu" style={{ fontWeight: 500 }}>Nữ</Link>
                    <Link to="/sale" style={{ fontWeight: 500, color: 'var(--color-error)' }}>Sale</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link to="/cart" style={{ position: 'relative' }}>
                        <ShoppingBag size={24} color="var(--color-primary)" />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-5px', right: '-8px',
                                background: 'var(--color-accent)', color: '#fff',
                                fontSize: '0.7rem', fontWeight: 'bold',
                                width: '18px', height: '18px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-4">
                            {['admin', 'staff', 'shipper'].includes(user.role) && (
                                <Link to={
                                    user.role === 'admin' ? '/admin' :
                                        user.role === 'staff' ? '/staff' : '/shipper'
                                } style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Quản trị
                                </Link>
                            )}
                            <Link to="/profile" className="flex items-center gap-1">
                                <User size={24} color="var(--color-primary)" />
                            </Link>
                            <button onClick={handleLogout} style={{ padding: '4px' }}>
                                <LogOut size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
