import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';

const CheckoutPage = () => {
    const { cart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer_name: user?.name || '',
        customer_phone: '',
        shipping_address: '',
        payment_method: 'cod',
        note: ''
    });

    const [loading, setLoading] = useState(false);

    // Constants for demo
    const shippingFee = 30000;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cart?.items?.length) return toast.error('Giỏ hàng trống');

        setLoading(true);
        try {
            // 1. Create order payload
            const orderData = {
                ...formData,
                items: cart.items.map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    product_name: item.product_name || `Product #${item.product_id}`,
                    quantity: item.quantity,
                    price: item.price
                })),
                shipping_fee: shippingFee,
            };

            // 2. Submit order
            const res = await api.post('/orders', orderData);
            const order = res.data.order;

            // 3. Handle Payment Method
            if (formData.payment_method === 'vnpay') {
                const payRes = await api.post('/payments/create', { order_id: order.id });
                window.location.href = payRes.data.payment_url;
            } else {
                toast.success('Đặt hàng thành công!');
                navigate('/profile'); // or /orders/success
            }

        } catch (error) {
            toast.error('Lỗi khi đặt hàng: ' + (error.response?.data?.error || 'Vui lòng thử lại'));
        } finally {
            setLoading(false);
        }
    };

    if (!cart?.items?.length) {
        return <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>Chưa có sản phẩm để thanh toán</div>;
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Thanh Toán</h1>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>

                {/* User Info Form */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Thông Tin Giao Hàng</h3>

                    <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input type="text" name="customer_name" className="form-input" value={formData.customer_name} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <input type="tel" name="customer_phone" className="form-input" value={formData.customer_phone} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Địa chỉ nhận hàng chi tiết</label>
                        <textarea name="shipping_address" className="form-input" rows="3" value={formData.shipping_address} onChange={handleChange} required></textarea>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ghi chú đơn hàng (tuỳ chọn)</label>
                        <textarea name="note" className="form-input" rows="2" value={formData.note} onChange={handleChange}></textarea>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', marginTop: '3rem', textTransform: 'uppercase' }}>Phương Thức Thanh Toán</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                            <input type="radio" name="payment_method" value="cod" checked={formData.payment_method === 'cod'} onChange={handleChange} />
                            <span style={{ fontWeight: 500 }}>Thanh toán khi nhận hàng (COD)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                            <input type="radio" name="payment_method" value="vnpay" checked={formData.payment_method === 'vnpay'} onChange={handleChange} />
                            <span style={{ fontWeight: 500 }}>Thanh toán trực tuyến qua VNPay</span>
                        </label>
                    </div>
                </div>

                {/* Order Summary & Submit */}
                <div>
                    <div className="glass-card" style={{ backgroundColor: '#fafafa', border: 'none', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Tóm Tắt Đơn Hàng</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                            {cart.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span>{item.quantity}x {item.product_name || `Product #${item.product_id}`}</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Tạm tính:</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Vận chuyển (tiêu chuẩn):</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
                            <span>Tổng cộng:</span>
                            <span style={{ color: 'var(--color-accent)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal + shippingFee)}</span>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'ĐANG XỬ LÝ...' : (formData.payment_method === 'vnpay' ? 'THANH TOÁN QUA VNPAY' : 'HOÀN TẤT ĐẶT HÀNG')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;
