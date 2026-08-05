import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, Edit } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const STATUS_COLORS = {
    pending: '#FFBB28',      // Vàng (Chờ xử lý)
    confirmed: '#0088FE',    // Xanh dương (Đã xác nhận)
    shipping: '#00C49F',     // Xanh ngọc (Đang giao hàng)
    delivered: '#3b82f6',    // Xanh đậm (Hoàn tất)
    cancelled: '#ef4444',    // Đỏ (Đã Hủy)
    returned: '#a855f7'      // Tím (Trả hàng)
};

const STATUS_LABELS = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Thành công',
    cancelled: 'Đã Hủy',
    returned: 'Đổi/Trả'
};

const getAllowedStatuses = (role, currentStatus) => {
    const all = Object.keys(STATUS_LABELS);
    if (role === 'admin') return all;

    if (role === 'staff') {
        if (['delivered', 'cancelled', 'returned'].includes(currentStatus)) {
            return [currentStatus]; // Đã chốt (hoặc chết) thì không cho Staff sửa
        }
        return all; // Đơn hàng còn sống thì cho Staff toàn quyền nhảy cóc
    }

    if (role === 'shipper') {
        if (currentStatus === 'shipping') return ['shipping', 'delivered', 'returned', 'cancelled'];
        return [currentStatus]; // Đã đóng thì Shipper cũng không cho sửa
    }

    return [currentStatus];
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const OrderManagePage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // View detail modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 15, all_users: 1 };
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/orders', { params });
            setOrders(response.data.data || []);
            setTotalPages(response.data.last_page || 1);
        } catch (error) {
            console.error('Fetch orders error:', error);
            toast.error('Lỗi khi tải danh sách đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const handleStatusChange = (orderId, newStatus) => {
        // Lưu state cũ để phục hồi nếu gọi API lỗi (Optimistic Fallback)
        const originalOrders = [...orders];
        const originalSelected = selectedOrder ? { ...selectedOrder } : null;

        // Cập nhật phản hồi UI ngay lập tức
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        // Gọi API ngầm không block luồng Render
        api.put(`/orders/${orderId}/status`, { status: newStatus })
            .then(() => {
                toast.success('Cập nhật trạng thái thành công');
            })
            .catch(error => {
                toast.error(error.response?.data?.error || 'Lỗi đường truyền, đang trích xuất lại trạng thái gốc...');
                setOrders(originalOrders); // Rollback UI
                setSelectedOrder(originalSelected);
            });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Quản lý Đơn Hàng</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Theo dõi và xử lý đơn đặt hàng từ khách hàng</p>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                backgroundColor: 'var(--color-surface)', padding: '1rem',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '300px' }}>
                    <Filter size={18} color="var(--color-text-muted)" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none', flex: 1 }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Mã Đơn</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Khách hàng</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Ngày Đặt</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tổng Tiền</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng thái</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Không tìm thấy đơn hàng nào.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{order.order_number}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{order.customer_phone}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(order.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {formatCurrency(order.total)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            disabled={(isUpdating && selectedOrder?.id !== order.id) || getAllowedStatuses(user?.role, order.status).length <= 1}
                                            style={{
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: '99px',
                                                border: `1px solid ${STATUS_COLORS[order.status]}66`,
                                                color: STATUS_COLORS[order.status],
                                                backgroundColor: STATUS_COLORS[order.status] + '11',
                                                fontWeight: 600,
                                                outline: 'none',
                                                cursor: getAllowedStatuses(user?.role, order.status).length <= 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                appearance: getAllowedStatuses(user?.role, order.status).length <= 1 ? 'none' : 'auto'
                                            }}
                                        >
                                            {getAllowedStatuses(user?.role, order.status).map(key => (
                                                <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            title="Xem Chi Tiết"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-surface)', borderRadius: '12px', width: '100%', maxWidth: '800px',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Chi tiết đơn hàng <span style={{ color: 'var(--color-primary)' }}>{selectedOrder.order_number}</span>
                            </h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                            <div>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Sản phẩm ({selectedOrder.items?.length || 0})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {selectedOrder.items?.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--color-background)' }}>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    {item.variant_info || 'Mặc định'} x {item.quantity}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600 }}>
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tạm tính:</span> <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Phí vận chuyển:</span> <span>{formatCurrency(selectedOrder.shipping_fee || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                                        <span>Giảm giá (Voucher + Điểm + Ship):</span>
                                        <span>-{formatCurrency((selectedOrder.voucher_discount || 0) + (selectedOrder.points_discount || 0) + (selectedOrder.shipping_discount || 0))}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                        <span>Tổng cộng:</span> <span>{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '2rem', borderLeft: '1px solid var(--color-border)' }}>
                                <div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Thông tin khách hàng</h3>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>{selectedOrder.customer_name}</p>
                                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)' }}>{selectedOrder.customer_phone}</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        <strong>Địa chỉ:</strong><br />
                                        {selectedOrder.shipping_address}
                                    </p>
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Thanh toán & Trạng thái</h3>
                                    <p style={{ margin: '0 0 0.5rem 0' }}>
                                        Thanh toán: <span style={{ fontWeight: 600, textTransform: 'uppercase', color: selectedOrder.payment_method === 'vnpay' ? '#2563eb' : '#059669' }}>
                                            {selectedOrder.payment_method}
                                        </span>
                                    </p>
                                    <p style={{ margin: '0 0 0.5rem 0' }}>
                                        Ghi chú: <span style={{ color: 'var(--color-text-muted)' }}>{selectedOrder.note || 'Không có'}</span>
                                    </p>

                                    <div style={{ marginTop: '1rem' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 500 }}>Cập nhật trạng thái:</p>
                                        <select
                                            value={selectedOrder.status}
                                            onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '6px',
                                                border: `1px solid ${STATUS_COLORS[selectedOrder.status]}`,
                                                color: STATUS_COLORS[selectedOrder.status],
                                                fontWeight: 600,
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagePage;
