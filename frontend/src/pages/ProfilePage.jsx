import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            // Fetch orders logic if needed
            api.get('/orders').then(res => setOrders(res.data.data)).catch(console.error);
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Tài Khoản</h1>
                <button className="btn btn-outline" onClick={logout}>Đăng xuất</button>
            </div>

            <div className="grid grid-cols-4 gap-4" style={{ gridTemplateColumns: '1fr 3fr' }}>
                <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '2rem' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '1rem', marginBottom: '1.5rem' }}>Xin chào, {user.name}</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <li style={{ fontWeight: 500, color: 'var(--color-primary)' }}>Lịch Sử Đơn Hàng</li>
                        <li style={{ color: 'var(--color-text-muted)' }}>Mã Giảm Giá</li>
                        <li style={{ color: 'var(--color-text-muted)' }}>Hồ Sơ Của Tôi</li>
                        {['admin', 'staff'].includes(user.role) && (
                            <li style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Quản Trị Hệ Thống (Admin)</li>
                        )}
                    </ul>
                </div>

                <div>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Lịch Sử Đơn Hàng</h3>
                    {orders.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Bạn chưa có đơn hàng nào.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 0' }}>Mã Đơn</th>
                                    <th style={{ padding: '1rem 0' }}>Ngày đặt</th>
                                    <th style={{ padding: '1rem 0' }}>Trạng thái</th>
                                    <th style={{ padding: '1rem 0', textAlign: 'right' }}>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1.5rem 0', fontWeight: 'bold' }}>{order.order_number}</td>
                                        <td style={{ padding: '1.5rem 0', color: 'var(--color-text-muted)' }}>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '1.5rem 0', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--color-accent)' }}>{order.status}</td>
                                        <td style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 'bold' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
