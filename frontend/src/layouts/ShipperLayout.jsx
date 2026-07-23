import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    ShoppingCart,
    LogOut,
    Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { name: 'Đơn Hàng Giao', path: '/shipper', icon: <ShoppingCart size={20} />, exact: true },
];

const ShipperLayout = () => {
    const { logout } = useAuth();
    const location = useLocation();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', fontSize: '1.5rem' }}>ASMAW</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Trang đối tác giao hàng (Shipper)</span>
                </div>

                <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {menuItems.map((item) => {
                        const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 1.5rem',
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                                    backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                                    fontWeight: isActive ? 600 : 500,
                                    borderRight: isActive ? '3px solid var(--color-accent)' : '3px solid transparent'
                                }}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link
                        to="/"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', width: '100%', padding: '0.5rem', fontWeight: 500, borderRadius: '6px', transition: 'background-color 0.2s', textDecoration: 'none' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Store size={20} />
                        Quay về cửa hàng
                    </Link>
                    <button
                        onClick={logout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)', width: '100%', padding: '0.5rem', fontWeight: 500, borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s', border: 'none', background: 'transparent' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default ShipperLayout;
