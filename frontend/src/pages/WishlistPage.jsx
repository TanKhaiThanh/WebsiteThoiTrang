import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Heart, Trash2 } from 'lucide-react';

const getFinalImageUrl = (url) => {
    if (!url) return "";
    let parsedUrl = url;
    if (url.includes("/storage/uploads/products/")) parsedUrl = url.replace("/storage/uploads/products/", "/api/media/image/");
    if (url.includes("/storage/uploads/banners/")) parsedUrl = url.replace("/storage/uploads/banners/", "/api/media/image/");
    if (parsedUrl.startsWith("http")) return parsedUrl;
    
    if (import.meta.env && import.meta.env.PROD) return parsedUrl;
    
    const baseUrl = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(//api/?$/, "") : "http://localhost:8000";
    return baseUrl + parsedUrl;
};
    let parsedUrl = url;
    if (url.includes("/storage/uploads/products/")) parsedUrl = url.replace("/storage/uploads/products/", "/api/media/image/");
    if (url.includes("/storage/uploads/banners/")) parsedUrl = url.replace("/storage/uploads/banners/", "/api/media/image/");
    if (parsedUrl.startsWith("http")) return parsedUrl;
    
    if (import.meta.env && import.meta.env.PROD) return parsedUrl;
    
    const baseUrl = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(//api/?$/, "") : "http://localhost:8000";
    return baseUrl + parsedUrl;
};

const WishlistPage = () => {
    const { wishlist, toggleWishlist } = useWishlist();

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '80vh', padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 'normal', color: '#111', marginBottom: '1rem', letterSpacing: '2px' }}>
                        SẢN PHẨM YÊU THÍCH
                    </h1>
                    <div style={{ width: '40px', height: '1px', backgroundColor: '#8a6e3e', margin: '0 auto' }}></div>
                </div>

                {wishlist.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '4rem 0' }}>
                        <Heart size={48} strokeWidth={1} style={{ marginBottom: '1rem', color: '#ccc' }} />
                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Bạn chưa có sản phẩm yêu thích nào.</p>
                        <Link to="/products" style={{ display: 'inline-block', backgroundColor: '#111', color: '#fff', padding: '1rem 3rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
                            Khám phá ngay
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                        {wishlist.map(product => (
                            <div key={product.id} style={{ position: 'relative' }}>
                                <Link to={`/products/${product.id}`} style={{ display: 'block', position: 'relative', overflow: 'hidden', aspectRatio: '3/4', marginBottom: '1rem' }}>
                                    <img
                                        src={product.primary_image?.url ? getFinalImageUrl(product.primary_image.url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {product.sale_price && (
                                        <div style={{
                                            position: 'absolute', top: '12px', left: '12px',
                                            background: '#9e7a3b', color: '#fff',
                                            padding: '4px 8px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>
                                            SALE
                                        </div>
                                    )}
                                </Link>

                                {/* Nút Remove */}
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: '#fff', border: '1px solid #eaeaea', borderRadius: '50%',
                                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 10, color: '#e63946'
                                    }}
                                    title="Xóa khỏi yêu thích"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div style={{ textAlign: 'center' }}>
                                    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem', fontWeight: 500, color: '#333' }}>{product.name}</h3>
                                    </Link>
                                    <div style={{ fontSize: '0.8rem' }}>
                                        {product.sale_price ? (
                                            <>
                                                <span style={{ fontWeight: 600, color: '#8a6e3e', marginRight: '0.5rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}</span>
                                                <span style={{ textDecoration: 'line-through', color: '#999' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                            </>
                                        ) : (
                                            <span style={{ fontWeight: 600, color: '#333' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;

