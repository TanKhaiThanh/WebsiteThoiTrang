import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--color-dark)',
            color: 'var(--color-text-light)',
            padding: '4rem 0 2rem 0',
            marginTop: 'auto'
        }}>
            <div className="container grid grid-cols-4 gap-4" style={{ marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ color: 'var(--color-surface)', fontSize: '2rem', marginBottom: '1rem' }}>ASMAW</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Thương hiệu thời trang cao cấp mang đến trải nghiệm tinh tế, sang trọng và hiện đại cho cả nam và nữ.
                    </p>
                </div>
                <div>
                    <h4 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dịch Vụ Khách Hàng</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <li><a href="#">Hỏi đáp (FAQ)</a></li>
                        <li><a href="#">Chính sách đổi trả</a></li>
                        <li><a href="#">Chính sách giao hàng</a></li>
                        <li><a href="#">Hướng dẫn chọn size</a></li>
                    </ul>
                </div>
                <div>
                    <h4 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1px' }}>Về ASMAW</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <li><a href="#">Câu chuyện thương hiệu</a></li>
                        <li><a href="#">Hệ thống cửa hàng</a></li>
                        <li><a href="#">Tuyển dụng</a></li>
                        <li><a href="#">Liên hệ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '1px' }}>Đăng Ký Nhận Tin</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Nhận thông tin về các bộ sưu tập mới và ưu đãi đặc biệt.
                    </p>
                    <div className="flex">
                        <input type="email" placeholder="Email của bạn" style={{
                            flex: 1, padding: '0.75rem', border: '1px solid #333',
                            background: '#1a1a1a', color: '#fff', outline: 'none'
                        }} />
                        <button className="btn btn-gold" style={{ padding: '0 1rem' }}>Gửi</button>
                    </div>
                </div>
            </div>
            <div className="container" style={{ textAlign: 'center', borderTop: '1px solid #333', paddingTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>&copy; {new Date().getFullYear()} ASMAW Fashion. Đồ Án Chuyên Ngành.</p>
            </div>
        </footer>
    );
};

export default Footer;
