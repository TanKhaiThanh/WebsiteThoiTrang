import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRequestToken = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.data.success) {
                toast.success('Gửi yêu cầu thành công! Vui lòng kiểm tra hộp thư (hoặc mục Spam) của bạn.');
                setStep(2);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Email không tồn tại trong hệ thống.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                otp: token,
                password: newPassword,
                password_confirmation: newPassword
            });
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Mã khôi phục không đúng hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0', display: 'flex', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--color-surface)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)' }}>Khôi Phục Mật Khẩu</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {step === 1 ? 'Vui lòng nhập Email để nhận mã xác nhận' : 'Điền mã xác nhận và mật khẩu mới'}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestToken}>
                        <div className="form-group">
                            <label className="form-label">Email tài khoản</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="customer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU LẤY LẠI MẬT KHẨU'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label className="form-label">Email tài khoản</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                disabled
                                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mã khôi phục (6 số)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ví dụ: 123456"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mật khẩu mới</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Ít nhất 6 ký tự"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Đang xác nhận...' : 'ĐẶT LẠI MẬT KHẨU'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Gửi lại mã khôi phục
                            </button>
                        </div>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Nhớ mật khẩu rồi? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Đăng nhập</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
