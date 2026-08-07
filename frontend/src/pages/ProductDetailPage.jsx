import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ShoppingBag, Loader2 } from 'lucide-react';

const sizeOrderMap = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7, 'FREESIZE': 8 };

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const getFinalImageUrl = (url) => {
    if (!url) return '';
    let parsedUrl = url;
    if (url.includes('/storage/uploads/products/')) parsedUrl = url.replace('/storage/uploads/products/', '/api/media/image/');
    if (url.includes('/storage/uploads/banners/')) parsedUrl = url.replace('/storage/uploads/banners/', '/api/media/image/');
    if (parsedUrl.startsWith('http')) return parsedUrl;
    if (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.PROD) return parsedUrl;
    const baseUrl = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return ${baseUrl};
};

    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');

    // Selection state
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isBuying, setIsBuying] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                const data = res.data.product;
                setProduct(data);

                // Defaults
                if (data.variants?.length > 0) {
                    const defaultColor = data.variants[0].color;
                    setSelectedColor(defaultColor);

                    const defaultImage = data.images?.find(i => i.color === defaultColor) || data.images?.[0];
                    if (defaultImage) setMainImage(defaultImage.url);

                    const availableSizes = [...new Set(data.variants.filter(v => v.color === defaultColor).map(v => v.size))];
                    const hasSizeS = availableSizes.find(s => s.toUpperCase() === 'S');
                    if (hasSizeS) {
                        setSelectedSize(hasSizeS);
                    } else {
                        const sortedNewSizes = availableSizes.sort((a, b) => {
                            return (sizeOrderMap[a.toUpperCase()] || 99) - (sizeOrderMap[b.toUpperCase()] || 99);
                        });
                        setSelectedSize(sortedNewSizes[0]);
                    }
                }
                // Fetch Reviews
                const rvRes = await api.get(`/reviews?product_id=${id}&is_approved=1`);
                setReviews(rvRes.data.data || []);
            } catch (error) {
                toast.error('Không thể tải thông tin sản phẩm');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>Đang tải...</div>;
    if (!product) return <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>Sản phẩm không tồn tại</div>;

    // Extract unique colors and sizes from variants
    const colors = [...new Set(product.variants?.map(v => v.color) || [])];
    const sizes = [...new Set(product.variants?.filter(v => v.color === selectedColor).map(v => v.size) || [])].sort((a, b) => {
        const orderA = sizeOrderMap[a.toUpperCase()] || 99;
        const orderB = sizeOrderMap[b.toUpperCase()] || 99;
        return orderA - orderB;
    });

    // Find selected variant
    const selectedVariant = product.variants?.find(v => v.color === selectedColor && v.size === selectedSize);
    const stock = selectedVariant?.inventory?.available_qty || 0;
    const currentPrice = selectedVariant?.price_override || product.sale_price || product.price;

    const handleAddToCart = async () => {
        if (!selectedVariant) {
            toast.error('Vui lòng chọn màu sắc và kích cỡ');
            return;
        }
        if (quantity > stock) {
            toast.error('Số lượng vượt quá tồn kho hiện tại');
            return;
        }

        setIsAdding(true);
        const { success } = await addToCart(product.id, selectedVariant.id, quantity, currentPrice, product);
        setIsAdding(false);

        if (success) {
            toast.success('Đã thêm vào giỏ hàng');
        } else {
            toast.error('Thêm giỏ hàng thất bại, vui lòng tải lại trang!');
        }
    };

    const handleBuyNow = async () => {
        setIsBuying(true);
        const oldAdding = isAdding; // prevent both loading

        if (!selectedVariant) { setIsBuying(false); toast.error('Vui lòng chọn màu sắc và kích cỡ'); return; }
        if (quantity > stock) { setIsBuying(false); toast.error('Số lượng vượt quá tồn kho hiện tại'); return; }

        const { success } = await addToCart(product.id, selectedVariant.id, quantity, currentPrice, product);
        setIsBuying(false);

        if (success) navigate('/cart');
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) return toast.error('Vui lòng đăng nhập để đánh giá');
        if (!newComment.trim()) return toast.error('Vui lòng nhập nội dung đánh giá');
        try {
            await api.post('/reviews', { product_id: product.id, rating: newRating, comment: newComment });
            toast.success('Đã gửi đánh giá thành công! Quản trị viên sẽ phê duyệt trong chốc lát.');
            setNewComment('');
            setNewRating(5);
        } catch (error) {
            toast.error('Gặp lỗi khi gửi đánh giá');
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div className="grid grid-cols-2 gap-4" style={{ gap: '4rem' }}>

                {/* Images Gallery */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '90px', maxHeight: '420px', overflowY: 'auto', paddingRight: '5px' }}>
                        {product.images?.filter((img, _, allImgs) => {
                            const hasSpecificColorImages = allImgs.some(i => i.color === selectedColor);
                            return hasSpecificColorImages ? (img.color === selectedColor) : !img.color;
                        }).map((img, idx) => (
                            <img
                                key={idx}
                                src={getFinalImageUrl(img.url)}
                                alt="thumb"
                                onClick={() => setMainImage(img.url)}
                                style={{
                                    width: '100%', aspectRatio: '3/4', objectFit: 'cover', cursor: 'pointer', flexShrink: 0,
                                    border: mainImage === img.url ? '2px solid var(--color-primary)' : '1px solid transparent'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={mainImage ? getFinalImageUrl(mainImage) : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                            alt={product.name}
                            style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: '600px' }}
                        />
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <div style={{ textTransform: 'uppercase', color: 'var(--color-text-muted)', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '1rem' }}>
                        {product.brand || 'ASMAW'}
                    </div>

                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{product.name}</h1>

                    <div style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
                        </span>
                        {product.sale_price && (
                            <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.1rem', marginLeft: '1rem' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                            </span>
                        )}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Màu sắc</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {colors.map(color => {
                                const colorMap = { 'trắng': '#ffffff', 'đen': '#000000', 'đỏ': '#ef4444', 'xanh': '#3b82f6', 'xanh lá': '#16a34a', 'vàng': '#eab308', 'be': '#f4ebd8', 'tím than': '#1e3a8a', 'hồng': '#ec4899', 'nâu': '#78350f', 'cam': '#f97316', 'xám': '#9ca3af', 'tím': '#8b5cf6' };
                                const displayColor = color.startsWith('#') ? color : (colorMap[color.toLowerCase()] || '#a1a1aa');

                                return (
                                    <button
                                        key={color}
                                        title={color}
                                        onClick={() => {
                                            setSelectedColor(color);
                                            const colorImage = product.images?.find(img => img.color === color);
                                            if (colorImage) setMainImage(colorImage.url);
                                            const newSizes = [...new Set(product.variants?.filter(v => v.color === color).map(v => v.size) || [])];
                                            if (newSizes.length > 0) {
                                                if (!newSizes.includes(selectedSize)) {
                                                    const hasSizeS = newSizes.find(s => s.toUpperCase() === 'S');
                                                    if (hasSizeS) {
                                                        setSelectedSize(hasSizeS);
                                                    } else {
                                                        const sortedNewSizes = newSizes.sort((a, b) => {
                                                            return (sizeOrderMap[a.toUpperCase()] || 99) - (sizeOrderMap[b.toUpperCase()] || 99);
                                                        });
                                                        setSelectedSize(sortedNewSizes[0]);
                                                    }
                                                }
                                            }
                                        }}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            border: selectedColor === color ? '2px solid #111' : '1px solid #e5e7eb',
                                            backgroundColor: displayColor,
                                            padding: 0,
                                            cursor: 'pointer',
                                            outlineOffset: '3px',
                                            outline: selectedColor === color ? '1px solid #111' : 'none'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kích thước</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        width: '40px', height: '40px',
                                        border: selectedSize === size ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        backgroundColor: selectedSize === size ? 'var(--color-primary)' : 'transparent',
                                        color: selectedSize === size ? '#fff' : 'var(--color-primary)'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Số lượng</h4>
                        <div style={{ display: 'flex', border: '1px solid var(--color-border)' }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}>-</button>
                            <input
                                type="number"
                                min="1"
                                max={stock}
                                value={quantity}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) return setQuantity('');
                                    if (val > stock) { toast.error(`Kho chỉ còn ${stock} cái`); val = stock; }
                                    setQuantity(val);
                                }}
                                onBlur={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val) || val < 1) val = 1;
                                    setQuantity(val);
                                }}
                                style={{ width: '50px', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}
                            />
                            <button onClick={() => {
                                if (quantity >= stock) {
                                    toast.error(`Kho chỉ còn ${stock} cái`);
                                    return;
                                }
                                setQuantity(quantity + 1);
                            }} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}>+</button>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-error)' }}>
                            {stock === 0 ? 'Hết hàng' : ''}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            className="btn btn-outline"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
                            onClick={handleAddToCart}
                            disabled={stock === 0 || isAdding}
                        >
                            {isAdding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                            {isAdding ? 'Đang thêm...' : 'Thêm Vào Giỏ'}
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                            onClick={handleBuyNow}
                            disabled={stock === 0 || isBuying}
                        >
                            {isBuying ? <Loader2 size={18} className="animate-spin" /> : null}
                            {isBuying ? 'Đang tải...' : 'Mua Ngay'}
                        </button>
                    </div>

                    {/* Description Accordion (Simplified) */}
                    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Thông tin sản phẩm</h3>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{product.description}</p>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid var(--color-border)', paddingTop: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>NỀN TẢNG ĐÁNH GIÁ TỪ KHÁCH HÀNG</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>

                    {/* List Reviews */}
                    <div>
                        {reviews.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {reviews.map(rv => (
                                    <div key={rv.id} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #eaeaea' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {/* Fallback avatar */} KH
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Thành viên Asmaw
                                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'normal', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                                        ✔ Đã mua hàng
                                                    </span>
                                                </p>
                                                <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                                    {'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{rv.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Review Form */}
                    <div style={{ backgroundColor: '#fdfdfc', padding: '2rem', border: '1px solid #eaeaea', borderRadius: '4px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>Viết đánh giá của bạn</h3>
                        {!user ? (
                            <div style={{ padding: '1rem', backgroundColor: '#fffbe1', border: '1px solid #fef08a', color: '#b45309', borderRadius: '4px' }}>
                                Vui lòng <a href="/login" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>đăng nhập</a> để tham gia đánh giá sản phẩm.
                            </div>
                        ) : (
                            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mức độ hài lòng (Sao)</label>
                                    <select
                                        value={newRating}
                                        onChange={(e) => setNewRating(parseInt(e.target.value))}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                                    >
                                        <option value={5}>⭐⭐⭐⭐⭐ (5) Xuất sắc</option>
                                        <option value={4}>⭐⭐⭐⭐ (4) Tốt</option>
                                        <option value={3}>⭐⭐⭐ (3) Bình thường</option>
                                        <option value={2}>⭐⭐ (2) Kém</option>
                                        <option value={1}>⭐ (1) Rất tệ</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Nội dung đánh giá</label>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={4}
                                        placeholder="Bạn thấy sản phẩm này thế nào ..."
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', outline: 'none' }}
                                    ></textarea>
                                </div>
                                <button type="submit" style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '1rem', fontWeight: 600, borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#333'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#111'}>
                                    Gửi Đánh Giá
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;

