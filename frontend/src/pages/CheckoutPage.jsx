import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';

const CheckoutPage = () => {
    const { cart, cartTotal, fetchCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Điểm thưởng (Reward Points)
    const [userPoints, setUserPoints] = React.useState(0);
    const [usePointsInput, setUsePointsInput] = React.useState('');
    const [usedPoints, setUsedPoints] = React.useState(0);
    const [pointsDiscount, setPointsDiscount] = React.useState(0);

    const [formData, setFormData] = useState({
        customer_name: user?.name || '',
        customer_phone: '',
        province: '', // Tỉnh/Thành
        ward: '', // Phường/Xã mới
        street: '', // Số nhà
        payment_method: 'cod',
        note: ''
    });

    const [errors, setErrors] = useState({});

    const [provinces, setProvinces] = useState([]);
    const [shippingSettings, setShippingSettings] = useState(null);

    // Nếu chưa chọn thì gán bằng 0
    const [calculatedShippingFee, setCalculatedShippingFee] = useState(0);

    const [loading, setLoading] = useState(false);

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const [autoFill, setAutoFill] = useState(false);

    // Initial fetch points, shipping settings, and provinces
    React.useEffect(() => {
        if (user) {
            api.get(`/points/${user.id}`).then(res => {
                setUserPoints(res.data.points?.balance || 0);
            }).catch(console.error);
        }

        // Fetch Shipping Settings
        api.get('/shipping/settings').then(res => {
            setShippingSettings(res.data);
            setCalculatedShippingFee(0); // Mặc định về 0 để không hiển thị tiền vống
        }).catch(console.error);

        // Fetch Province from ESGOO
        fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
            .then(res => res.json())
            .then(data => {
                if (data.error === 0) setProvinces(data.data);
            })
            .catch(console.error);
    }, [user]);

    // Calculate real-time shipping fee
    React.useEffect(() => {
        if (!shippingSettings) return;
        if (cartTotal >= (shippingSettings.free_shipping_threshold || 500000)) {
            setCalculatedShippingFee(0);
            return;
        }

        const pName = formData.province.toLowerCase();
        const wName = formData.ward.toLowerCase();

        // Nếu chưa chọn Tỉnh thành thì trả về 0 để hiển thị "Theo khu vực"
        if (pName.trim() === '') {
            setCalculatedShippingFee(0);
            return;
        }

        if (pName.includes('hồ chí minh') || pName.includes('hcm')) {
            setCalculatedShippingFee(shippingSettings.zone_1_fee);
        } else if (/(bình dương|đồng nai|long an|tây ninh|bà rịa)/i.test(pName)) {
            setCalculatedShippingFee(shippingSettings.zone_2_fee);
        } else if (/(cần thơ|đà nẵng|bình thuận|tiền giang|bến tre|đồng tháp|vĩnh long|trà vinh|kiên giang|sóc trăng|cà mau|an giang|tây nguyên|đắk lắk|khánh hòa|ninh thuận|phú yên)/i.test(pName)) {
            setCalculatedShippingFee(shippingSettings.zone_3_fee);
        } else {
            setCalculatedShippingFee(shippingSettings.zone_4_fee);
        }
    }, [formData.province, formData.ward, cartTotal, shippingSettings]);

    const finalTotal = Math.max(0, cartTotal + calculatedShippingFee - discount - pointsDiscount);

    const handleChange = (e) => {
        let { name, value } = e.target;
        // Tự động viết hoa chữ cái đầu của mỗi từ trong Phường/Xã
        if (name === 'ward') {
            value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        setFormData({ ...formData, [name]: value });
        // Xoá lỗi khi người dùng bắt đầu nhập lại
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

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

    const handleAutoFill = async (e) => {
        const checked = e.target.checked;
        setAutoFill(checked);
        if (checked && user) {
            try {
                const res = await api.get('/auth/me');
                const profile = res.data.user || res.data;
                const parsed = parseAddress(profile.address);
                setFormData(prev => ({
                    ...prev,
                    customer_name: profile.name || prev.customer_name,
                    customer_phone: profile.phone || prev.customer_phone,
                    street: parsed.street || prev.street,
                    ward: parsed.ward || prev.ward,
                    province: parsed.province || prev.province
                }));
                toast.success('Đã điền thông tin tự động');
            } catch (error) {
                toast.error('Không thể lấy thông tin. Vui lòng nhập thủ công.');
            }
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setApplyingCoupon(true);
        try {
            const res = await api.post('/coupons/validate', { code: couponCode, order_total: cartTotal });
            setDiscount(res.data.discount_amount || res.data.discount || 0);
            toast.success('Áp dụng mã giảm giá thành công');
        } catch (error) {
            setDiscount(0);
            toast.error(error.response?.data?.error || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleApplyPointsLocal = () => {
        const pts = parseInt(usePointsInput, 10);
        if (isNaN(pts) || pts <= 0) return toast.error('Vui lòng nhập số điểm hợp lệ');
        if (pts > userPoints) return toast.error('Điểm của bạn không đủ');

        let discountVal = pts * 1000;
        if (discountVal > (cartTotal - discount)) {
            toast.error('Nhập số điểm vượt quá tổng tiền thanh toán cần thiết');
            return;
        }

        setUsedPoints(pts);
        setPointsDiscount(discountVal);
        toast.success(`Sử dụng ${pts} điểm (-${new Intl.NumberFormat('vi-VN').format(discountVal)} ₫)`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cart?.items?.length) return toast.error('Giỏ hàng trống');

        // Validation thủ công
        let newErrors = {};
        if (!formData.customer_name.trim()) newErrors.customer_name = 'Vui lòng nhập Họ và tên';
        if (!formData.customer_phone.trim()) newErrors.customer_phone = 'Vui lòng nhập Số điện thoại';
        if (!formData.province) newErrors.province = 'Vui lòng chọn Tỉnh / Thành phố';
        if (!formData.ward.trim()) newErrors.ward = 'Vui lòng nhập Phường / Xã';
        if (!formData.street.trim()) newErrors.street = 'Vui lòng nhập Số nhà, Tên đường';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
            return;
        }

        setLoading(true);
        try {
            // 1. Create order payload
            const orderData = {
                ...formData,
                shipping_address: `${formData.street}, ${formData.ward}, ${formData.province}`,
                items: cart.items.map(item => {
                    let variantInfoStr = 'Mặc định';
                    if (item.product_details && item.variant_id) {
                        const variant = item.product_details.variants?.find(v => v.id === item.variant_id);
                        if (variant) {
                            variantInfoStr = (variant.color || '') + (variant.size ? ` / ${variant.size}` : '');
                        }
                    }

                    return {
                        product_id: item.product_id,
                        variant_id: item.variant_id,
                        product_name: item.product_details?.name || item.product_name || `Product #${item.product_id}`,
                        variant_info: variantInfoStr,
                        quantity: item.quantity,
                        price: item.price
                    };
                }),
                shipping_fee: calculatedShippingFee,
                voucher_discount: discount,
                points_discount: pointsDiscount,
                coupon_code: discount > 0 ? couponCode : null,
                total_amount: finalTotal
            };

            // 2. Submit order
            if (formData.payment_method === 'bank_transfer') {
                toast.error('Tính năng thanh toán qua ngân hàng đang được bảo trì nâng cấp. Vui lòng chọn Phương thức khác.');
                setLoading(false);
                return;
            }

            const res = await api.post('/orders', orderData);
            const order = res.data.order;

            // Redeem points in backend mapping
            if (usedPoints > 0) {
                try {
                    await api.post('/points/redeem', { points: usedPoints });
                } catch (ex) {
                    console.error("Deduct points failed", ex);
                }
            }

            // 3. Handle Payment Method
            if (formData.payment_method === 'vnpay') {
                const payRes = await api.post('/payments/create', { order_id: order.id });
                window.location.href = payRes.data.payment_url;
            } else {
                toast.success('Đặt hàng thành công!');
                await fetchCart(); // Reset cart context because items are cleared in DB
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

            <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>

                {/* User Info Form */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Thông Tin Giao Hàng</h3>

                    {user && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={autoFill} onChange={handleAutoFill} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>Sử dụng địa chỉ mặc định trong tài khoản của tôi</span>
                            </label>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Họ và tên <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" name="customer_name" className={`form-input ${errors.customer_name ? 'border-red-500' : ''}`} style={errors.customer_name ? { borderColor: '#ef4444' } : {}} value={formData.customer_name} onChange={handleChange} />
                        {errors.customer_name && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.customer_name}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Số điện thoại <span style={{ color: 'red' }}>*</span></label>
                        <input type="tel" name="customer_phone" className={`form-input ${errors.customer_phone ? 'border-red-500' : ''}`} style={errors.customer_phone ? { borderColor: '#ef4444' } : {}} value={formData.customer_phone} onChange={handleChange} />
                        {errors.customer_phone && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.customer_phone}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tỉnh / Thành Phố <span style={{ color: 'red' }}>*</span></label>
                            <select name="province" className={`form-input ${errors.province ? 'border-red-500' : ''}`} style={errors.province ? { borderColor: '#ef4444' } : {}} value={formData.province} onChange={handleChange}>
                                <option value="">Chọn Tỉnh/Thành phố...</option>
                                {provinces.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            {errors.province && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.province}</div>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Phường / Xã <span style={{ color: 'red' }}>*</span></label>
                            <input type="text" name="ward" className={`form-input ${errors.ward ? 'border-red-500' : ''}`} style={errors.ward ? { borderColor: '#ef4444' } : {}} placeholder="Ví dụ: Phường Bến Thành" value={formData.ward} onChange={handleChange} />
                            {errors.ward && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.ward}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Số nhà, Tên đường <span style={{ color: 'red' }}>*</span></label>
                        <textarea name="street" className={`form-input ${errors.street ? 'border-red-500' : ''}`} style={errors.street ? { borderColor: '#ef4444' } : {}} rows="2" placeholder="Ví dụ: 141 Nguyễn Du" value={formData.street} onChange={handleChange}></textarea>
                        {errors.street && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.street}</div>}
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
                            <input type="radio" name="payment_method" value="bank_transfer" checked={formData.payment_method === 'bank_transfer'} onChange={handleChange} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Chuyển khoản qua ngân hàng</span>
                            </div>
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
                                    <span>{item.quantity}x {item.product_details?.name || item.product_name || `Product #${item.product_id}`}</span>
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
                            <span>
                                {cartTotal >= (shippingSettings?.free_shipping_threshold || 500000)
                                    ? 'Miễn phí'
                                    : (formData.province.trim() === ''
                                        ? <i>Dựa theo khu vực</i>
                                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatedShippingFee))
                                }
                            </span>
                        </div>

                        {/* Coupon Form */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Mã giảm giá</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" className="form-input" placeholder="Nhập mã..." value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{ flex: 1, padding: '0.5rem 1rem' }} />
                                <button type="button" className="btn btn-outline" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode} style={{ padding: '0.5rem 1.5rem' }}>
                                    {applyingCoupon ? 'Kiểm tra...' : 'Áp Dụng'}
                                </button>
                            </div>
                        </div>

                        {/* Reward Points Modudle */}
                        {(userPoints > 0) && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px dashed var(--color-accent)', borderRadius: '4px', backgroundColor: '#fdfdfd' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <span>Tích điểm</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Khả dụng: {userPoints}</span>
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Số điểm muốn dùng..."
                                        value={usePointsInput}
                                        onChange={e => setUsePointsInput(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem 1rem' }}
                                        max={userPoints}
                                        disabled={usedPoints > 0}
                                    />
                                    {usedPoints > 0 ? (
                                        <button type="button" className="btn btn-outline" onClick={() => { setUsedPoints(0); setPointsDiscount(0); setUsePointsInput(''); }} style={{ padding: '0.5rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}>Hủy Bỏ</button>
                                    ) : (
                                        <button type="button" className="btn btn-outline" onClick={handleApplyPointsLocal} disabled={!usePointsInput} style={{ padding: '0.5rem 1.5rem' }}>Dùng</button>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', display: 'block' }}>Quy đổi: 1 điểm = 1,000₫</span>
                            </div>
                        )}

                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--color-success)', fontWeight: 500 }}>
                                <span>Mã khuyến mãi:</span>
                                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount)}</span>
                            </div>
                        )}

                        {pointsDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--color-accent)', fontWeight: 500 }}>
                                <span>Trừ điểm thành viên:</span>
                                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pointsDiscount)}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
                            <span>Tổng cộng:</span>
                            <span style={{ color: 'var(--color-accent)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}</span>
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
