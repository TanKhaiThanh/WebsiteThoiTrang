import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const validHash = window.location.hash.replace('#', '');
    const initialTab = ['orders', 'profile'].includes(validHash) ? validHash : 'orders';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        window.location.hash = activeTab;
    }, [activeTab]);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        password: '',
        new_password: ''
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            // Fetch orders logic if needed
            api.get('/orders').then(res => setOrders(res.data.data)).catch(console.error);
        }
    }, [user, navigate]);

    const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const { toast } = await import('sonner');
            const res = await api.put('/auth/me', profileData);
            toast.success('Cập nhật hồ sơ thành công');
            if (res.data.user) {
                localStorage.setItem('asmaw_user', JSON.stringify(res.data.user));
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            const { toast } = await import('sonner');
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setUpdatingProfile(false);
        }
    };

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
                        <li
                            onClick={() => setActiveTab('orders')}
                            style={{ fontWeight: activeTab === 'orders' ? 600 : 400, color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer' }}
                        >
                            Lịch Sử Đơn Hàng
                        </li>
                        <li
                            onClick={() => setActiveTab('profile')}
                            style={{ fontWeight: activeTab === 'profile' ? 600 : 400, color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer' }}
                        >
                            Hồ Sơ Của Tôi
                        </li>
                        {['admin', 'staff'].includes(user.role) && (
                            <li style={{ color: 'var(--color-accent)', fontWeight: 'bold', marginTop: '1rem' }}>
                                Quản Trị Hệ Thống (Admin)
                            </li>
                        )}
                    </ul>
                </div>

                <div>
                    {activeTab === 'orders' && (
                        <>
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
                                            <th style={{ padding: '1rem 0', textAlign: 'center' }}>Thao tác</th>
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
                                                <td style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                                                    {order.status === 'delivered' ? (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                            onClick={async () => {
                                                                // Mock prompt for now until custom modal is built
                                                                const reason = window.prompt("Nhập lý do đổi/trả hàng:");
                                                                if (reason) {
                                                                    try {
                                                                        const { toast } = await import('sonner');
                                                                        await api.post('/returns', { order_id: order.id, reason });
                                                                        toast.success("Đã gửi yêu cầu hoàn trả thành công. Vui lòng chờ phản hồi.");
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                }
                                                            }}
                                                        >Hoàn / Đổi Trả</button>
                                                    ) : order.status === 'pending' ? (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                            onClick={async () => {
                                                                const confirm = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
                                                                if (confirm) {
                                                                    try {
                                                                        const { toast } = await import('sonner');
                                                                        await api.post(`/orders/${order.id}/cancel`);
                                                                        toast.success("Hủy đơn hàng thành công.");
                                                                        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
                                                                    } catch (e) {
                                                                        const { toast } = await import('sonner');
                                                                        toast.error(e.response?.data?.error || "Lỗi khi hủy đơn hàng");
                                                                    }
                                                                }
                                                            }}
                                                        >Hủy Đơn</button>
                                                    ) : (
                                                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Theo dõi</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {activeTab === 'profile' && (
                        <>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Cập Nhật Thông Tin</h3>
                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                                <div className="form-group">
                                    <label className="form-label">Tên hiển thị</label>
                                    <input type="text" name="name" className="form-input" value={profileData.name} onChange={handleProfileChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số điện thoại</label>
                                    <input type="tel" name="phone" className="form-input" value={profileData.phone} onChange={handleProfileChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Địa chỉ mặc định</label>
                                    <textarea name="address" className="form-input" rows="3" value={profileData.address} onChange={handleProfileChange}></textarea>
                                </div>

                                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '1rem 0' }}></div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '-0.5rem' }}>Đổi mật khẩu</h4>

                                <div className="form-group">
                                    <label className="form-label">Mật khẩu cũ (Để trống nếu không đổi)</label>
                                    <input type="password" name="password" className="form-input" value={profileData.password} onChange={handleProfileChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mật khẩu mới</label>
                                    <input type="password" name="new_password" className="form-input" value={profileData.new_password} onChange={handleProfileChange} />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={updatingProfile} style={{ marginTop: '1rem', width: 'fit-content' }}>
                                    {updatingProfile ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
