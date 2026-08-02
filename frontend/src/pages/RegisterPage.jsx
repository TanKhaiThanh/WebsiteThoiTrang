import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirmation) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        const result = await register({
            name,
            email,
            phone,
            password,
            password_confirmation: passwordConfirmation
        });
        setLoading(false);

        if (result.success) {
            toast.success('Đăng ký tài khoản thành công!');
            navigate('/');
        } else {
            toast.error(result.error || 'Đăng ký thất bại. Email có thể đã tồn tại.');
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--color-surface)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)' }}>Tạo Tài Khoản</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Tham gia cùng ASMAW để nhận nhiều ưu đãi</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Họ và tên</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nguyễn Văn A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="email@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Số điện thoại (Tuỳ chọn)</label>
                        <input
                            type="tel"
                            className="form-input"
                            placeholder="0901234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mật khẩu</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Ít nhất 6 ký tự"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Nhập lại mật khẩu"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Đang khởi tạo...' : 'ĐĂNG KÝ TÀI KHOẢN'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Đăng nhập ngay</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
