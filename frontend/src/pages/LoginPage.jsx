import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultRoute } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(email, password);
        if (result.success) {
            toast.success('Đăng nhập thành công!');
            // Get user from localStorage because state might not have updated yet
            const storedUser = JSON.parse(localStorage.getItem('asmaw_user'));
            const redirectPath = getDefaultRoute(storedUser?.role);
            navigate(redirectPath);
        } else {
            toast.error(result.error || 'Sai email hoặc mật khẩu.');
        }

        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '6rem 0', display: 'flex', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-surface)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)' }}>Chào mừng trở lại</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Đăng nhập để trải nghiệm mua sắm tuyệt vời</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="VD: customer@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mật khẩu</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Quên mật khẩu?</Link>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Đăng ký ngay</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
