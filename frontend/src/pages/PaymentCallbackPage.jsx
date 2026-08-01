import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const PaymentCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing | success | failed
    const [orderNumber, setOrderNumber] = useState('');

    useEffect(() => {
        const processCallback = async () => {
            const responseCode = searchParams.get('vnp_ResponseCode');
            const txnRef = searchParams.get('vnp_TxnRef');

            if (!responseCode || !txnRef) {
                setStatus('failed');
                return;
            }

            // Gửi toàn bộ query params về Backend để xác thực chữ ký (Signature)
            try {
                const params = Object.fromEntries(searchParams.entries());
                const res = await api.get('/payments/callback', { params });

                if (res.data.success) {
                    setStatus('success');
                    setOrderNumber(res.data.order?.order_number || txnRef.split('_')[0]);
                } else {
                    setStatus('failed');
                    setOrderNumber(txnRef.split('_')[0]);
                }
            } catch (error) {
                console.error('Payment callback error:', error);
                // Fallback: Kiểm tra trực tiếp từ responseCode
                if (responseCode === '00') {
                    setStatus('success');
                    setOrderNumber(txnRef.split('_')[0]);
                } else {
                    setStatus('failed');
                    setOrderNumber(txnRef.split('_')[0]);
                }
            }
        };

        processCallback();
    }, [searchParams]);

    return (
        <div className="container" style={{ padding: '6rem 0', display: 'flex', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)', textAlign: 'center' }}
            >
                {status === 'processing' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                            Đang xử lý thanh toán...
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Vui lòng đợi trong giây lát.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#16a34a', marginBottom: '1rem' }}>
                            Thanh toán thành công!
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Đơn hàng <strong style={{ color: 'var(--color-primary)' }}>{orderNumber}</strong> của bạn đã được thanh toán.
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            Cửa hàng sẽ xác nhận và gửi hàng trong thời gian sớm nhất.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link to="/profile#orders" className="btn btn-primary">
                                Xem đơn hàng
                            </Link>
                            <Link to="/" className="btn btn-outline">
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#ef4444', marginBottom: '1rem' }}>
                            Thanh toán thất bại
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            {orderNumber && <>Đơn hàng <strong>{orderNumber}</strong> </>}chưa được thanh toán thành công.
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link to="/profile#orders" className="btn btn-primary">
                                Xem đơn hàng
                            </Link>
                            <Link to="/" className="btn btn-outline">
                                Về trang chủ
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentCallbackPage;
