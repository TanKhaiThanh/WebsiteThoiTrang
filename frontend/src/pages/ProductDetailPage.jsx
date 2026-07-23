import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');

    // Selection state
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                const data = res.data.product;
                setProduct(data);

                // Defaults
                if (data.images?.length > 0) setMainImage(data.images[0].url);
                if (data.variants?.length > 0) {
                    setSelectedColor(data.variants[0].color);
                    setSelectedSize(data.variants[0].size);
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
    const sizes = [...new Set(product.variants?.filter(v => v.color === selectedColor).map(v => v.size) || [])];

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

        const { success } = await addToCart(product.id, selectedVariant.id, quantity, currentPrice);
        if (success) {
            toast.success('Đã thêm vào giỏ hàng');
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        navigate('/cart');
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '80px' }}>
                        {product.images?.map((img, idx) => (
                            <img
                                key={idx}
                                src={img.url}
                                alt="thumb"
                                onClick={() => setMainImage(img.url)}
                                style={{
                                    width: '100%', aspectRatio: '3/4', objectFit: 'cover', cursor: 'pointer',
                                    border: mainImage === img.url ? '2px solid var(--color-primary)' : '1px solid transparent'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                        <img
                            src={mainImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                            alt={product.name}
                            style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
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
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        // Reset size when color changes
                                        const newSizes = [...new Set(product.variants?.filter(v => v.color === color).map(v => v.size) || [])];
                                        if (newSizes.length > 0) setSelectedSize(newSizes[0]);
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem', border: selectedColor === color ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        backgroundColor: selectedColor === color ? '#f5f5f5' : 'transparent', color: 'var(--color-primary)'
                                    }}
                                >
                                    {color}
                                </button>
                            ))}
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
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ width: '50px', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}
                            />
                            <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}>+</button>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: stock > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleAddToCart} disabled={stock === 0}>
                            Thêm Vào Giỏ Giá
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleBuyNow} disabled={stock === 0}>
                            Mua Ngay
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
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Id Khách hàng #{rv.user_id}</p>
                                                <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
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
                                        placeholder="Khải Thịnh là hệ tư tưởng. Bạn thấy sản phẩm này thế nào..."
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
