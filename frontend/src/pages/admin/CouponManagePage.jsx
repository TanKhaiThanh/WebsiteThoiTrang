import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Tag, Calendar, Activity } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const TYPE_LABELS = {
    percentage: 'Giảm theo phần trăm (%)',
    fixed: 'Giảm tiền cố định (VNĐ)',
    free_shipping: 'Miễn phí vận chuyển'
};

const CouponManagePage = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'percentage',
        value: '',
        min_order_amount: '',
        max_discount: '',
        usage_limit: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
        exclude_sale_items: false
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data.coupons?.data || res.data.data || res.data.coupons || []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("Lỗi khi tải danh sách Coupon");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setFormData({
            code: '', name: '', type: 'percentage', value: '',
            min_order_amount: '', max_discount: '', usage_limit: '',
            starts_at: '', expires_at: '', is_active: true, exclude_sale_items: false
        });
        setShowModal(true);
    };

    const openEdit = (coupon) => {
        setEditingId(coupon.id);
        const formatDateTime = (val) => val ? val.slice(0, 16) : ''; // format for datetime-local "YYYY-MM-DDThh:mm"
        setFormData({
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            value: coupon.value,
            min_order_amount: coupon.min_order_amount || '',
            max_discount: coupon.max_discount || '',
            usage_limit: coupon.usage_limit || '',
            starts_at: formatDateTime(coupon.starts_at),
            expires_at: formatDateTime(coupon.expires_at),
            is_active: !!coupon.is_active,
            exclude_sale_items: !!coupon.exclude_sale_items
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Clean payload
            const payload = { ...formData };
            if (payload.type === 'free_shipping') payload.value = 0;
            if (!payload.min_order_amount) delete payload.min_order_amount;
            if (!payload.max_discount) delete payload.max_discount;
            if (!payload.usage_limit) delete payload.usage_limit;
            if (!payload.starts_at) delete payload.starts_at;
            if (!payload.expires_at) delete payload.expires_at;

            if (editingId) {
                await api.put(`/coupons/${editingId}`, payload);
                toast.success("Cập nhật mã giảm giá thành công");
            } else {
                await api.post('/coupons', payload);
                toast.success("Tạo mã giảm giá thành công");
            }
            setShowModal(false);
            fetchCoupons();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Có lỗi xảy ra khi lưu");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn coupon này?")) return;
        try {
            await api.delete(`/coupons/${id}`);
            toast.success("Xóa coupon thành công");
            fetchCoupons();
        } catch (error) {
            toast.error("Lỗi khi xóa");
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Kho Khuyến Mãi (Coupons)</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cấu hình mã giảm giá và chương trình ưu đãi</p>
                </div>
                <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={20} /> Tạo Coupon Kích Cầu
                </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', display: 'flex' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text" placeholder="Tìm theo mã Code hoặc Tên..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Mã Code</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Chi Tiết Giảm Giá</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Thời hạn</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tình trạng</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</td></tr>
                        ) : filteredCoupons.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Chưa có mã giảm giá nào.</td></tr>
                        ) : (
                            filteredCoupons.map(coupon => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                return (
                                    <tr key={coupon.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px dashed #2563eb', borderRadius: '4px', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>
                                                {coupon.code}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{coupon.name}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--color-error)' }}>
                                                {coupon.type === 'percentage' ? `Giảm ${coupon.value}%` :
                                                    coupon.type === 'fixed' ? `Giảm ${formatCurrency(coupon.value)}` :
                                                        'Miễn phí vận chuyển'}
                                            </div>
                                            {(coupon.min_order_amount || coupon.max_discount) && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                    {coupon.min_order_amount && <span>Đơn từ {formatCurrency(coupon.min_order_amount)}. </span>}
                                                    {coupon.max_discount && <span>Giảm tối đa {formatCurrency(coupon.max_discount)}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span><Activity size={12} /> {coupon.usage_count}/{coupon.usage_limit || '∞'} lượt</span>
                                                {coupon.expires_at && <span><Calendar size={12} /> HSD: {new Date(coupon.expires_at).toLocaleDateString('vi-VN')}</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {isExpired ? (
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Hết hạn</span>
                                            ) : coupon.is_active ? (
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.85rem', fontWeight: 600 }}>Hoạt động</span>
                                            ) : (
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>Tạm ngưng</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button onClick={() => openEdit(coupon)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginRight: '1rem' }}>
                                                <Edit size={20} />
                                            </button>
                                            <button onClick={() => handleDelete(coupon.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0' }}>{editingId ? 'Chỉnh Sửa Coupon' : 'Tạo Coupon Mới'}</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Mã Code (Tự ráp) *</label>
                                    <input required type="text" name="code" value={formData.code} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', textTransform: 'uppercase' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Tên Chương Trình (Gợi nhớ) *</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Loại giảm giá</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Giá trị giảm *</label>
                                    <input required={formData.type !== 'free_shipping'} type="number" name="value" value={formData.value} onChange={handleInputChange} disabled={formData.type === 'free_shipping'} placeholder={formData.type === 'percentage' ? '%' : 'VNĐ'} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Đơn hàng tối thiểu (VNĐ)</label>
                                    <input type="number" min="0" name="min_order_amount" value={formData.min_order_amount} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Giảm tối đa (VNĐ)</label>
                                    <input type="number" min="0" name="max_discount" value={formData.max_discount} onChange={handleInputChange} disabled={formData.type !== 'percentage'} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Số lượt dùng (Giới hạn kho)</label>
                                    <input type="number" min="1" name="usage_limit" value={formData.usage_limit} onChange={handleInputChange} placeholder="Không giới hạn" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                                        <input type="checkbox" name="exclude_sale_items" checked={formData.exclude_sale_items} onChange={handleInputChange} />
                                        Không áp dụng cho Hàng sale
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Bắt đầu từ</label>
                                    <input type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Hết hạn vào</label>
                                    <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                                    Active (Kích hoạt ngay)
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                                <button type="submit" disabled={submitting} style={{ padding: '0.6rem 2rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>
                                    {submitting ? 'Đang lưu...' : 'Lưu Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManagePage;
