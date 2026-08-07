import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const validHash = window.location.hash.replace('#', '');
    const initialTab = ['orders', 'profile', 'points'].includes(validHash) ? validHash : 'orders';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Points state
    const [pointData, setPointData] = useState(null);
    const [pointHistory, setPointHistory] = useState([]);

    // Modal states
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        window.location.hash = activeTab;
    }, [activeTab]);

    // Helper to parse existing address formatted as "Street, Ward, Province"
    const parseAddress = (fullAddress) => {
        if (!fullAddress) return { street: '', ward: '', province: '' };
        const parts = fullAddress.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            return {
                province: parts[parts.length - 1],
                ward: parts[parts.length - 2],
                street: parts.slice(0, parts.length - 2).join(', ')
            };
        }
        return { street: fullAddress, ward: '', province: '' };
    };

    const initialAddr = parseAddress(user?.address);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        province: initialAddr.province,
        ward: initialAddr.ward,
        street: initialAddr.street,
        password: '',
        new_password: ''
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const [provinces, setProvinces] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            // Fetch orders logic if needed
            api.get('/orders').then(res => setOrders(res.data.data)).catch(console.error);
            // Fetch point logic
            api.get(`/points/${user.id}`).then(res => {
                setPointData(res.data.points);
                setPointHistory(res.data.history);
            }).catch(console.error);
        }

        // Fetch Provinces for Address Options
        fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
            .then(res => res.json())
            .then(data => {
                if (data.error === 0) setProvinces(data.data);
            })
            .catch(console.error);
    }, [user, navigate]);

    const handleProfileChange = (e) => {
        let { name, value } = e.target;
        if (name === 'ward') {
            value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        setProfileData({ ...profileData, [name]: value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!profileData.province) return (await import('sonner')).toast.error('Vui lòng chọn Tỉnh / Thành phố');
        if (!profileData.ward.trim()) return (await import('sonner')).toast.error('Vui lòng nhập Phường / Xã');
        if (!profileData.street.trim()) return (await import('sonner')).toast.error('Vui lòng nhập Số nhà, Tên đường');

        setUpdatingProfile(true);
        try {
            const { toast } = await import('sonner');
            const payload = {
                ...profileData,
                address: `${profileData.street}, ${profileData.ward}, ${profileData.province}`
            };
            const res = await api.put('/auth/me', payload);
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
                        <li
                            onClick={() => setActiveTab('points')}
                            style={{ fontWeight: activeTab === 'points' ? 600 : 400, color: activeTab === 'points' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer' }}
                        >
                            Thành Viên & Điểm Thưởng
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
                                                                setSelectedOrder(order);
                                                                setReturnReason('');
                                                                setReturnModalOpen(true);
                                                            }}
                                                        >Hoàn / Đổi Trả</button>
                                                    ) : order.status === 'pending' ? (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                            onClick={async () => {
                                                                setSelectedOrder(order);
                                                                setCancelModalOpen(true);
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Tỉnh / Thành Phố</label>
                                        <select name="province" className="form-input" value={profileData.province} onChange={handleProfileChange} required>
                                            <option value="">Chọn Tỉnh/Thành phố...</option>
                                            {provinces.map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phường / Xã</label>
                                        <input type="text" name="ward" className="form-input" placeholder="Ví dụ: Phường Bến Thành" value={profileData.ward} onChange={handleProfileChange} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số nhà, Tên đường</label>
                                    <textarea name="street" className="form-input" rows="2" placeholder="Ví dụ: 141 Nguyễn Du" value={profileData.street} onChange={handleProfileChange} required></textarea>
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

                    {activeTab === 'points' && (
                        <>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Điểm Thưởng Của Tôi</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Khả dụng</p>
                                    <h4 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-accent)' }}>{pointData?.balance || 0}</h4>
                                </div>
                                <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Đã Tích Lũy</p>
                                    <h4 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>{pointData?.total_earned || 0}</h4>
                                </div>
                                <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Đã Sử Dụng</p>
                                    <h4 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>{pointData?.total_spent || 0}</h4>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Lịch Sử Giao Dịch</h4>
                            {pointHistory.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Bạn chưa có giao dịch điểm nào.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem 0' }}>Ngày</th>
                                            <th style={{ padding: '1rem 0' }}>Loại</th>
                                            <th style={{ padding: '1rem 0', textAlign: 'right', paddingRight: '1rem' }}>Điểm</th>
                                            <th style={{ padding: '1rem 0' }}>Diễn giải</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pointHistory.map(tx => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td style={{ padding: '1rem 0' }}>
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: tx.type === 'earn' ? '#dcfce7' : '#fee2e2',
                                                        color: tx.type === 'earn' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {tx.type === 'earn' ? 'Tích thêm' : 'Đổi thưởng'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right', paddingRight: '1rem', fontWeight: 'bold', color: tx.amount > 0 ? '#16a34a' : '#dc2626' }}>
                                                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                </td>
                                                <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>{tx.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>
            {/* Modal Hủy Đơn */}
            <AnimatePresence>
                {cancelModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: '#ef4444' }}>Xác Nhận Hủy Đơn Hàng</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Bạn có chắc chắn muốn hủy đơn hàng <strong>{selectedOrder?.order_number}</strong>? Hành động này không thể hoàn tác.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn btn-outline" onClick={() => setCancelModalOpen(false)} disabled={isSubmitting}>Hủy Bỏ</button>
                                <button className="btn btn-primary" onClick={async () => {
                                    if (!selectedOrder) return;
                                    setIsSubmitting(true);
                                    try {
                                        const { toast } = await import('sonner');
                                        await api.post(`/orders/${selectedOrder.id}/cancel`);
                                        toast.success("Hủy đơn hàng thành công.");
                                        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o));
                                        setCancelModalOpen(false);
                                    } catch (e) {
                                        const { toast } = await import('sonner');
                                        toast.error(e.response?.data?.error || "Lỗi khi hủy đơn hàng");
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }} disabled={isSubmitting} style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
                                    {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐỒNG Ý HỦY'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Hoàn/Đổi Trả */}
            <AnimatePresence>
                {returnModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>Yêu Cầu Hoàn / Đổi Trả Giao Dịch</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Vui lòng cho chúng tôi biết chi tiết lý do ngài muốn đổi hoặc trả lại đơn hàng <strong>{selectedOrder?.order_number}</strong>.
                            </p>
                            <textarea
                                className="form-input"
                                rows={4}
                                placeholder="Lý do đổi/trả hàng (Bắt buộc)..."
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                style={{ marginBottom: '1.5rem', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn btn-outline" onClick={() => setReturnModalOpen(false)} disabled={isSubmitting}>Hủy Bỏ</button>
                                <button className="btn btn-primary" onClick={async () => {
                                    if (!selectedOrder || !returnReason.trim()) {
                                        const { toast } = await import('sonner');
                                        toast.error("Vui lòng nhập lý do đổi/trả hàng");
                                        return;
                                    }
                                    setIsSubmitting(true);
                                    try {
                                        const { toast } = await import('sonner');
                                        await api.post('/returns', { order_id: selectedOrder.id, reason: returnReason });
                                        toast.success("Đã gửi yêu cầu hoàn trả thành công. Vui lòng chờ phản hồi.");
                                        setReturnModalOpen(false);
                                    } catch (e) {
                                        const { toast } = await import('sonner');
                                        toast.error(e.response?.data?.error || "Lỗi khi gửi yêu cầu đổi/trả hàng");
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }} disabled={isSubmitting}>
                                    {isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
