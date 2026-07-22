import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
    return (
        <div className="product-card">
            <Link to={`/products/${product.id}`} className="product-image-wrap">
                <img
                    src={product.primary_image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                    alt={product.name}
                    className="product-image"
                />
                {product.sale_price && (
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'var(--color-error)', color: '#fff',
                        padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                    }}>
                        Sale
                    </div>
                )}
            </Link>
            <div className="product-info">
                <div className="product-brand">{product.brand || 'ASMAW'}</div>
                <Link to={`/products/${product.id}`}>
                    <h3 className="product-name">{product.name}</h3>
                </Link>
                <div>
                    {product.sale_price ? (
                        <>
                            <span className="product-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}</span>
                            <span className="product-price-old">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                        </>
                    ) : (
                        <span className="product-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const HomePage = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/products?featured=1&per_page=4')
            .then(res => setFeaturedProducts(res.data.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-wrapper">
            {/* Hero Banner */}
            <section style={{
                height: '80vh',
                background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop") center/cover no-repeat',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-surface)', textAlign: 'center'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="container"
                >
                    <h4 style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem' }}>
                        New Collection 2024
                    </h4>
                    <h1 style={{ fontSize: '4rem', marginBottom: '2rem', color: '#fff' }}>Thanh Lịch & Sang Trọng</h1>
                    <Link to="/products" className="btn btn-gold">Khám Phá Ngay</Link>
                </motion.div>
            </section>

            {/* Featured Products */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem' }}>Sản Phẩm Nổi Bật</h2>
                        <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--color-accent)', margin: '1rem auto' }}></div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {featuredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <Link to="/products" className="btn btn-outline">Xem Tất Cả Sản Phẩm</Link>
                    </div>
                </div>
            </section>

            {/* Features Banner */}
            <section style={{ padding: '4rem 0', backgroundColor: 'var(--color-dark-surface)', color: '#fff' }}>
                <div className="container grid grid-cols-4 gap-4" style={{ textAlign: 'center' }}>
                    <div>
                        <h4 style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Freeship</h4>
                        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Đơn hàng từ 500k</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Đổi/Trả</h4>
                        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Linh hoạt 30 ngày</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Thanh Toán</h4>
                        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>An toàn với VNPay</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}>Hỗ Trợ</h4>
                        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Hotline 24/7</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
