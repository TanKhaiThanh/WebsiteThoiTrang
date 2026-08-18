import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const STATUS_DICT = {
    pending: { label: 'Chờ duyệt', color: '#eab308', bg: '#fef9c3' },
    approved: { label: 'Chấp nhận', color: '#16a34a', bg: '#dcfce7' },
    rejected: { label: 'Từ chối', color: '#dc2626', bg: '#fee2e2' },
    completed: { label: 'Đã hoàn tất', color: '#2563eb', bg: '#dbeafe' }
};

const ReturnManagePage = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await api.get('/returns');
            setReturns(res.data.returns?.data || res.data.data || res.data.returns || []);
        } catch (error) {
            console.error('Fetch returns error:', error);
            toast.error("Lỗi khi tải danh sách đổi/trả");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleAction = async (id, action) => {
        const confirmMsg = action === 'approve'
            ? "Chấp nhận yêu cầu đổi/trả này và thông báo khách gửi hàng về kho?"
            : "Từ chối yêu cầu đổi/trả này?";

        if (!window.confirm(confirmMsg)) return;

        setProcessingId(id);
        try {
            await api.post(`/returns/${id}/${action}`);
            toast.success(`Đã ${action === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu`);
            fetchReturns(); // Tải lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.error || "Lỗi xử lý");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredReturns = returns.filter(r =>
        r.order?.order_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.reason?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Quản lý Đổi/Trả Hàng</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Phê duyệt yêu cầu trả hàng, bảo hành từ khách hàng</p>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', display: 'flex' }}>
                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text" placeholder="Tìm theo Mã đơn hàng hoặc Lý do..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID / Khách hàng</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Chi Tiết Sản Phẩm</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Lý do đổi/trả</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tình trạng</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredReturns.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Chưa có yêu cầu đổi/trả nào.</td></tr>
                        ) : (
                            filteredReturns.map(req => {
                                const statusConfig = STATUS_DICT[req.status] || { label: req.status, color: '#000', bg: '#eee' };

                                return (
                                    <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>#{req.id}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 500 }}>Đơn: {req.order?.order_number || 'Không rõ'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                {new Date(req.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <RefreshCw size={20} color="#94a3b8" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{req.order?.items?.[0]?.product_name || 'Đơn hàng mồ côi'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                        Phân loại: {req.order?.items?.[0]?.variant_info || 'Mặc định'} - SL: x{req.order?.items?.[0]?.quantity || 1}
                                                        {req.order?.items?.length > 1 && ` (+${req.order.items.length - 1} SP khác)`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.reason}>
                                                {req.reason}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                Đề xuất: {req.action === 'refund' ? 'Hoàn tiền' : 'Đổi mới'}
                                            </div>
                                            {req.proof_images && req.proof_images.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                    {req.proof_images.map((img, idx) => (
                                                        <a key={idx} href={img.startsWith('http') ? img : (import.meta.env.PROD ? '/api' + img : 'http://localhost:8000' + img)} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={img.startsWith('http') ? img : (import.meta.env.PROD ? '/api' + img : 'http://localhost:8000' + img)}
                                                                alt={`Proof ${idx}`}
                                                                style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 8px', borderRadius: '4px',
                                                backgroundColor: statusConfig.bg, color: statusConfig.color,
                                                fontSize: '0.85rem', fontWeight: 600
                                            }}>{statusConfig.label}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {req.status === 'pending' ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleAction(req.id, 'approve')}
                                                        title="Phê duyệt yêu cầu"
                                                        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleAction(req.id, 'reject')}
                                                        title="Từ chối yêu cầu"
                                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Không hỗ trợ</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnManagePage;
