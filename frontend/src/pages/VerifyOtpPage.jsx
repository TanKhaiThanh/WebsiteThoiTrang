import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { useAuth, getDefaultRoute } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const VerifyOtpPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);

    useEffect(() => {
        if (!email) {
            toast.error('Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.');
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.nextSibling && element.value !== '') {
            element.nextSibling.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Vui lòng nhập đủ 6 số OTP.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp: otpString });
            toast.success(res.data.message || 'Xác thực thành công!');

            // Xử lý Login state
            localStorage.setItem('asmaw_token', res.data.token);
            localStorage.setItem('asmaw_user', JSON.stringify(res.data.user));
            // Kích hoạt context state thủ công
            // Chờ một chút để auth context cập nhật trước khi navigate
            setTimeout(() => {
                window.location.href = getDefaultRoute(res.data.user.role);
            }, 100);

        } catch (error) {
            toast.error(error.response?.data?.error || 'Mã OTP không hợp lệ.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await api.post('/auth/resend-otp', { email });
            toast.success('Mã OTP mới đã được gửi!');
            setResendCooldown(60);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi lại mã.');
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-primary)' }}>Xác thực tài khoản</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Vui lòng nhập mã OTP 6 số được gửi đến<br />
                        <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '8px' }}>
                        {otp.map((data, index) => (
                            <input
                                style={{
                                    width: '100%',
                                    height: '3.5rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    backgroundColor: 'var(--color-background)',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                type="text"
                                name="otp"
                                maxLength="1"
                                key={index}
                                value={data}
                                onChange={e => handleChange(e.target, index)}
                                onFocus={e => e.target.select()}
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join('').length !== 6}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            opacity: (loading || otp.join('').length !== 6) ? 0.5 : 1,
                            cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'XÁC NHẬN'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Chưa nhận được mã? </span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontWeight: '600',
                            color: resendCooldown > 0 ? 'var(--color-border)' : 'var(--color-primary)',
                            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                            textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                        }}
                    >
                        {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
