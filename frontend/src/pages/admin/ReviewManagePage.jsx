import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'sonner';
import { Trash2, CheckSquare } from 'lucide-react';

const ReviewManagePage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews');
            setReviews(res.data.data || res.data || []);
        } catch (error) {
            toast.error('Lỗi tải danh sách Đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.put(`/reviews/${id}/approve`);
            toast.success('Đã duyệt đánh giá');
            fetchReviews();
        } catch (error) {
            toast.error('Lỗi khi duyệt đánh giá');
        }
    };

    const handleDelete = async (id) => {
        setConfirmDeleteId(id);
    };

    if (loading) return <div className="p-4">Đang tải...</div>;

    const reviewArray = Array.isArray(reviews) ? reviews : (reviews.data || []); // In case it's paginated

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', margin: 0 }}>Kiểm duyệt Đánh Giá (Reviews)</h1>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sản phẩm</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Đánh giá</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nội dung (Bình luận)</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Tác vụ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviewArray.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500, fontSize: '0.95rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.product?.name || `Product ID: ${r.product_id}`}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600, color: '#f59e0b' }}>
                                    {r.rating} Sao
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.comment}>
                                    {r.comment || 'Không có bình luận'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {r.is_approved ? (
                                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 600, borderRadius: '9999px' }}>Đã Duyệt</span>
                                    ) : (
                                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 600, borderRadius: '9999px' }}>Chờ Duyệt</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {!r.is_approved && (
                                        <button onClick={() => handleApprove(r.id)} style={{ color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '1rem' }} title="Duyệt">
                                            <CheckSquare size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(r.id)} style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Xóa">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reviewArray.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chưa có đánh giá nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {confirmDeleteId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-error)' }}>Xác nhận xóa</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>Chắc chắn xóa đánh giá này? Hành động này không thể khôi phục.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmDeleteId(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
                            <button onClick={async () => {
                                try {
                                    await api.delete(`/reviews/${confirmDeleteId}`);
                                    toast.success('Xóa đánh giá thành công');
                                    fetchReviews();
                                } catch (error) {
                                    toast.error('Lỗi khi xóa đánh giá');
                                } finally {
                                    setConfirmDeleteId(null);
                                }
                            }} className="btn" style={{ flex: 1, backgroundColor: 'var(--color-error)', color: '#fff', border: 'none' }}>Xóa Tận Gốc</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagePage;
