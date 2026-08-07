import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';

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

const ProductCard = ({ product }) => {
    const { toggleWishlist, isWishlisted } = useWishlist();

    return (
        <div style={{ padding: '0', position: 'relative' }}>
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

            <button
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'none', border: 'none', cursor: 'pointer', zIndex: 10,
                    color: isWishlisted(product.id) ? '#e63946' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0
                }}
            >
                <Heart size={20} fill={isWishlisted(product.id) ? '#e63946' : 'none'} color={isWishlisted(product.id) ? '#e63946' : 'white'} />
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
    );
};

const HomePage = () => {
    const [saleProducts, setSaleProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        api.get('/products?has_sale=1&per_page=4')
            .then(res => setSaleProducts(res.data.data))
            .catch(err => console.error(err));

        api.get('/products?sort=created_at&order=desc&per_page=4')
            .then(res => setNewProducts(res.data.data))
            .catch(err => console.error(err));

        api.get('/banners?is_active=1')
            .then(res => setBanners(res.data.data))
            .catch(err => console.error(err));
    }, []);

    const heroBanner = banners.find(b => b.position === 'hero');
    const collectionBanner = banners.find(b => b.position === 'collection');

    return (
        <div style={{ backgroundColor: '#fdfdfc', color: '#333', fontFamily: 'var(--font-sans)', paddingBottom: 0 }}>
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                height: '80vh',
                backgroundColor: '#e6e4e1',
                backgroundImage: heroBanner ? `url('${getFinalImageUrl(heroBanner.image_url)}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
            }}>
                {heroBanner && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)' }}></div>}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                    style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}
                >
                    <p style={{ color: heroBanner ? '#fff' : '#c49a45', fontSize: '0.85rem', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: 600 }}>{heroBanner?.title || 'New Collection 2026'}</p>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '5rem', color: '#fff', marginBottom: '2.5rem', textShadow: '0 4px 15px rgba(0,0,0,0.15)', fontWeight: 'normal' }}>Thanh Lịch & Sang Trọng</h1>
                    <Link to={heroBanner?.link_url || "/products"} style={{ display: 'inline-block', backgroundColor: '#8a6e3e', color: '#fff', padding: '1rem 3rem', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', transition: 'background-color 0.3s' }}>
                        Khám Phá Ngay
                    </Link>
                </motion.div>
            </section>

            {/* SẢN PHẨM MỚI */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#fdfdfc', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '1rem', fontWeight: 'normal', color: '#333', letterSpacing: '2px' }}>SẢN PHẨM MỚI</h2>
                <div style={{ width: '40px', height: '1px', backgroundColor: '#8a6e3e', margin: '0 auto 4rem auto' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {newProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            <div style={{ height: '1px', backgroundColor: '#eaeaea', width: '100%' }}></div>

            {/* Artisan Section */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#fdfdfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', gap: '5rem' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#8a6e3e', marginBottom: '1.5rem', fontWeight: 600 }}>Kỹ nghệ thủ công</p>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.8rem', lineHeight: 1.1, marginBottom: '2rem', color: '#111', fontWeight: 'normal' }}>Vẻ Đẹp Đến Từ<br />Sự Tỉ Mỉ</h2>
                        <p style={{ color: '#555', lineHeight: 1.8, marginBottom: '3rem', fontSize: '0.95rem' }}>Mỗi sản phẩm tại ASMAW không chỉ là trang phục, mà là một tác phẩm nghệ thuật được nhào nặn bởi đôi bàn tay khéo léo của các nghệ nhân. Chúng tôi tin rằng sự sang trọng thực sự nằm ở sự tối giản và chất lượng vượt thời gian.</p>
                        <Link to="/about" style={{ display: 'inline-block', borderBottom: '1px solid #111', color: '#111', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', paddingBottom: '6px' }}>Tìm hiểu về chúng tôi</Link>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ padding: '0.5rem', border: '1px solid #eaeaea', backgroundColor: '#fff' }}>
                            <img src="/poster-hong.jpg" alt="Poster Thời Trang" style={{ width: '100%', display: 'block' }} />
                        </div>
                    </div>
                </div>
            </section>

            <div style={{ height: '1px', backgroundColor: '#eaeaea', width: '100%' }}></div>

            {/* SẢN PHẨM SALE */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#fdfdfc', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '1rem', fontWeight: 'normal', color: '#333', letterSpacing: '2px' }}>SẢN PHẨM SALE</h2>
                <div style={{ width: '40px', height: '1px', backgroundColor: '#8a6e3e', margin: '0 auto 4rem auto' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {saleProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            {/* BỘ SƯU TẬP MỚI */}
            <section style={{ padding: '4rem 2rem 6rem 2rem', backgroundColor: '#fdfdfc', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '1rem', fontWeight: 'normal', color: '#333', letterSpacing: '2px' }}>BỘ SƯU TẬP MỚI</h2>
                <div style={{ width: '40px', height: '1px', backgroundColor: '#8a6e3e', margin: '0 auto 4rem auto' }}></div>

                <div style={{
                    position: 'relative',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    height: '550px',
                    backgroundImage: collectionBanner ? `url('${getFinalImageUrl(collectionBanner.image_url)}')` : 'url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, color: '#fff', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>{collectionBanner ? collectionBanner.title : 'Fall Winter 2024'}</p>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '5rem', marginBottom: '2rem', fontWeight: 'normal', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>The Art of Silence</h2>
                        <Link to={collectionBanner ? collectionBanner.link_url : "/products?collection=fall-winter"} style={{ display: 'inline-block', backgroundColor: 'transparent', border: '1px solid #fff', color: '#fff', padding: '0.8rem 2.5rem', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none' }}>
                            Khám Phá Ngay
                        </Link>
                    </div>
                </div>
            </section>

            <div style={{ height: '1px', backgroundColor: '#eaeaea', width: '100%' }}></div>

            {/* Newsletter Section */}
            <section style={{ padding: '6rem 2rem', backgroundColor: '#fdfdfc', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '1rem', fontWeight: 'normal', color: '#111' }}>Trở thành một phần của thế giới ASMAW</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '3.5rem' }}>Nhận thông tin về bộ sưu tập mới và các ưu đãi đặc quyền.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0', maxWidth: '500px', margin: '0 auto' }}>
                    <input type="email" placeholder="Địa chỉ email của bạn" style={{ flex: 1, padding: '0.8rem 1rem', border: 'none', borderBottom: '1px solid #ccc', backgroundColor: 'transparent', outline: 'none', fontSize: '0.9rem' }} />
                    <button style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '0 3rem', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#333'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#000'}>Đăng Ký</button>
                </div>
            </section>
        </div>
    );
};

export default HomePage;

