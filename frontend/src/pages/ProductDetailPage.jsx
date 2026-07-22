import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

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
        </div>
    );
};

export default ProductDetailPage;
