import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const getFinalImageUrl = (url) => {
    if (!url) return '';
    let parsedUrl = url;
    if (url.includes('/storage/uploads/products/')) parsedUrl = url.replace('/storage/uploads/products/', '/api/media/image/');
    if (url.includes('/storage/uploads/banners/')) parsedUrl = url.replace('/storage/uploads/banners/', '/api/media/image/');
    if (parsedUrl.startsWith('http')) return parsedUrl;
    
    if (import.meta.env && import.meta.env.PROD) return parsedUrl;
    
    const baseUrl = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return baseUrl + parsedUrl;
};

const CartPage = () => {
    const { cart, loading, cartTotal, updateQuantity, removeItem } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (loading) return <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>Đang tải...</div>;

    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Giỏ Hàng TRống</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
                <Link to="/products" className="btn btn-primary">Tiếp Tục Mua Sắm</Link>
            </div>
        );
    }

    const handleCheckout = () => {
        if (!user) {
            toast.info('Vui lòng đăng nhập để thanh toán');
            navigate('/login?redirect=/checkout');
        } else {
            navigate('/checkout');
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Giỏ Hàng Của Bạn</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                {/* Cart Items List */}
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th style={{ paddingBottom: '1rem' }}>Sản phẩm</th>
                                <th style={{ paddingBottom: '1rem' }}>Đơn giá</th>
                                <th style={{ paddingBottom: '1rem', textAlign: 'center' }}>Số lượng</th>
                                <th style={{ paddingBottom: '1rem', textAlign: 'right' }}>Thành tiền</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.items.map(item => {
                                const productName = item.product_details?.name || item.product_name || `Product #${item.product_id}`;

                                let variantColor = "-";
                                let variantSize = "-";
                                if (item.product_details && item.variant_id) {
                                    const variant = item.product_details.variants?.find(v => v.id === item.variant_id);
                                    if (variant) {
                                        variantColor = variant.color || variantColor;
                                        variantSize = variant.size || variantSize;
                                    }
                                }

                                const normalizeString = (str) => str ? String(str).trim().normalize("NFC").toLowerCase() : "";
                                const normVarColor = normalizeString(variantColor);
                                
                                let variantImageUrl = null;
                                if (normVarColor && normVarColor !== "-" && item.product_details?.images) {
                                    const matchedImage = item.product_details.images.find(img => normalizeString(img.color) === normVarColor);
                                    if (matchedImage) {
                                        variantImageUrl = matchedImage.url;
                                    }
                                }

                                const productImage = variantImageUrl 
                                    ? getFinalImageUrl(variantImageUrl)
                                    : (item.product_details?.primary_image?.url
                                        ? getFinalImageUrl(item.product_details.primary_image.url)
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=random`);

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1.5rem 0' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '80px', height: '100px', backgroundColor: '#f5f5f5' }}>
                                                    <img
                                                        src={productImage}
                                                        alt={productName}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{productName}</h4>
                                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                        Color: {variantColor} | Size: {variantSize}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 0' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                        </td>
                                        <td style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                                                <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1} style={{ padding: '0.2rem 0.6rem', borderRight: '1px solid var(--color-border)', background: 'transparent' }}>-</button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    defaultValue={item.quantity}
                                                    key={item.quantity}
                                                    onBlur={(e) => {
                                                        let maxStock = 999;
                                                        if (item.product_details) {
                                                            if (item.variant_id) {
                                                                const variant = item.product_details.variants?.find(v => v.id == item.variant_id);
                                                                if (variant && variant.inventory) maxStock = variant.inventory.available_qty;
                                                            } else if (item.product_details.inventory_count != null) {
                                                                maxStock = item.product_details.inventory_count;
                                                            }
                                                        }
                                                        let val = parseInt(e.target.value);
                                                        if (isNaN(val) || val < 1) val = 1;
                                                        if (val > maxStock) {
                                                            toast.error(`Sản phẩm này chỉ còn ${maxStock} cái`);
                                                            val = maxStock;
                                                        }
                                                        e.target.value = val;
                                                        updateQuantity(item.id, val);
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                    style={{ width: '45px', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }}
                                                />
                                                <button onClick={(e) => {
                                                    let maxStock = 999;
                                                    if (item.product_details) {
                                                        if (item.variant_id) {
                                                            const variant = item.product_details.variants?.find(v => v.id == item.variant_id);
                                                            if (variant && variant.inventory) maxStock = variant.inventory.available_qty;
                                                        } else if (item.product_details.inventory_count != null) {
                                                            maxStock = item.product_details.inventory_count;
                                                        }
                                                    }
                                                    if (item.quantity >= maxStock) {
                                                        toast.error(`Sản phẩm này chỉ còn ${maxStock} cái`);
                                                        return;
                                                    }
                                                    updateQuantity(item.id, item.quantity + 1);
                                                }} style={{ padding: '0.2rem 0.6rem', borderLeft: '1px solid var(--color-border)', background: 'transparent' }}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 0', textAlign: 'right', fontWeight: 500, color: 'var(--color-accent)' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                                        </td>
                                        <td style={{ padding: '1.5rem 0', textAlign: 'right' }}>
                                            <button onClick={() => removeItem(item.id)} style={{ color: 'var(--color-error)' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Order Summary */}
                <div>
                    <div className="glass-card" style={{ backgroundColor: '#fafafa', border: 'none' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Tóm Tắt Đơn Hàng</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Tạm tính:</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Vận chuyển:</span>
                            <span>Tính khi thanh toán</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
                            <span>Tổng cộng:</span>
                            <span style={{ color: 'var(--color-accent)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</span>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckout}>
                            TIẾN HÀNH THANH TOÁN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;

