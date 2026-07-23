import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#f9fafb', color: '#111', paddingTop: '5rem', paddingBottom: '3rem', borderTop: '1px solid #e5e7eb' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>

                    {/* Cột 1: Thông tin thương hiệu */}
                    <div style={{ paddingRight: '2rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 500, letterSpacing: '-1px' }}>ASMAW</h2>
                        <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.8 }}>
                            Nâng tầm phong cách cá nhân với những thiết kế may đo cao cấp và chất liệu thượng hạng từ những nguồn cung ứng uy tín nhất thế giới.
                        </p>
                    </div>

                    {/* Cột 2: Sản Phẩm */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '2rem', color: '#111' }}>Sản Phẩm</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
                            <li><Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Bộ sưu tập mới</Link></li>
                            <li><Link to="/products?category_id=1" style={{ color: 'inherit', textDecoration: 'none' }}>Thời trang Nam</Link></li>
                            <li><Link to="/products?category_id=4" style={{ color: 'inherit', textDecoration: 'none' }}>Thời trang Nữ</Link></li>
                            <li><Link to="/products?category_id=5" style={{ color: 'inherit', textDecoration: 'none' }}>Phụ kiện đặc biệt</Link></li>
                        </ul>
                    </div>

                    {/* Cột 3: Thông Tin */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '2rem', color: '#111' }}>Thông Tin</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Về chúng tôi</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Hệ thống cửa hàng</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Liên hệ</a></li>
                            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Chính sách bảo mật</a></li>
                        </ul>
                    </div>

                    {/* Cột 4: Bản Tin & Form */}
                    <div>
                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '2rem', color: '#111' }}>Bản Tin</h4>
                        <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            Đăng ký nhận thông báo về các bộ sưu tập giới hạn.
                        </p>
                        <form style={{ display: 'flex', borderBottom: '1px solid #111', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                            <input
                                type="email"
                                placeholder="Địa chỉ email của bạn"
                                style={{
                                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                    fontSize: '0.85rem', color: '#111'
                                }}
                            />
                            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0.5rem' }}>
                                &#8594; {/* Right Arrow symbol */}
                            </button>
                        </form>

                        {/* Social Icons Mockup */}
                        <div style={{ display: 'flex', gap: '1rem', color: '#111' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </div>
                    </div>

                </div>

                {/* Copyright Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '2rem', color: '#9ca3af', fontSize: '0.75rem', letterSpacing: '1px' }}>
                    <p style={{ margin: 0, textTransform: 'uppercase' }}>&copy; {new Date().getFullYear()} ASMAW Luxury Fashion. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Điều khoản</a>
                        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Bảo mật</a>
                        <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
