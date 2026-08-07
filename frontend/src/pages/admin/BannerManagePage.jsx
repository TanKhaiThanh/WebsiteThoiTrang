import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const getFinalImageUrl = (url) => {
    if (!url) return '';
    let parsedUrl = url;
    if (url.includes('/storage/uploads/products/')) parsedUrl = url.replace('/storage/uploads/products/', '/api/media/image/');
    if (url.includes('/storage/uploads/banners/')) parsedUrl = url.replace('/storage/uploads/banners/', '/api/media/image/');
    if (parsedUrl.startsWith('http')) return parsedUrl;
    if (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.PROD) return parsedUrl;
    const baseUrl = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return ${baseUrl};
};

const BannerManagePage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', image_url: '', link_url: '', position: 'hero', is_active: true, order: 0 });
    const [editId, setEditId] = useState(null);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/banners');
            setBanners(res.data.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách banner');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/banners/${editId}`, formData);
                toast.success('Cập nhật banner thành công');
            } else {
                await api.post('/banners', formData);
                toast.success('Tạo banner thành công');
            }
            setShowModal(false);
            fetchBanners();
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu banner');
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const payload = new FormData();
        files.forEach(f => payload.append('images[]', f));

        try {
            toast.loading("Đang tải ảnh lên...");
            const res = await api.post('/media/upload-multiple', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss();

            if (res.data.urls && res.data.urls.length > 0) {
                setFormData(prev => ({ ...prev, image_url: res.data.urls[0] }));
                toast.success("Tải ảnh lên thành công");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi tải ảnh");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Chắc chắn xóa banner này?')) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success('Xóa banner thành công');
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi xóa banner');
        }
    };

    if (loading) return <div className="p-4">Đang tải...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', margin: 0 }}>Quản lý Banner</h1>
                <button
                    onClick={() => { setEditId(null); setFormData({ title: '', image_url: '', link_url: '', position: 'hero', is_active: true, order: 0 }); setShowModal(true); }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Thêm Mới
                </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Vị trí</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Hình ảnh</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tiêu đề / Link</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Thứ tự</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>{b.position}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ width: 120, height: 60, borderRadius: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                                        <img src={getFinalImageUrl(b.image_url)} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{b.title || '-'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.link_url}</div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {b.is_active ? <CheckCircle style={{ color: 'var(--color-success)', margin: '0 auto' }} size={20} /> : <XCircle style={{ color: 'var(--color-error)', margin: '0 auto' }} size={20} />}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{b.order}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => { setEditId(b.id); setFormData(b); setShowModal(true); }} style={{ color: 'var(--color-accent)', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(b.id)} style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', maxWidth: '500px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)' }}>
                            {editId ? 'Cập nhật Banner' : 'Thêm Banner Mới'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Hình Ảnh Banner *</label>
                                {formData.image_url && (
                                    <div style={{ marginBottom: '1rem', width: '100%', height: '140px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f0f0f0', position: 'relative' }}>
                                        <img src={getFinalImageUrl(formData.image_url)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <input required={!formData.image_url} type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '0.8rem', border: '1px dashed var(--color-border)', borderRadius: '4px', width: '100%', outline: 'none', backgroundColor: '#f9fafb' }} />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Hệ thống hỗ trợ thư mục tĩnh cục bộ thông qua Proxy NGINX.</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Vị trí (Position)</label>
                                    <select style={{ padding: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '4px', width: '100%', outline: 'none' }} value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}>
                                        <option value="hero">Hero (Đỉnh trang)</option>
                                        <option value="collection">Collection (Giữa trang)</option>
                                        <option value="footer">Footer</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Thứ tự hiển thị</label>
                                    <input type="number" style={{ padding: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '4px', width: '100%', outline: 'none' }} value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Tiêu đề Banner (Optional)</label>
                                <input type="text" style={{ padding: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '4px', width: '100%', outline: 'none' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Đường dẫn khi nhấp (Link URL)</label>
                                <input type="text" list="banner-links" style={{ padding: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '4px', width: '100%', outline: 'none' }} value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} placeholder="Ví dụ: /products hoặc nhập Url tùy ý" />
                                <datalist id="banner-links">
                                    <option value="/products">Tất cả sản phẩm</option>
                                    <option value="/products?category=nu">Bộ sưu tập Nữ</option>
                                    <option value="/products?category=nam">Bộ sưu tập Nam</option>
                                    <option value="/products?category=phu-kien">Phụ kiện</option>
                                    <option value="/products?sale=1">Danh mục Sale (Khuyến mãi)</option>
                                </datalist>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>* Click để chọn liên kết gợi ý hoặc tự nhập URL bất kỳ phù hợp.</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                <label htmlFor="isActive" style={{ fontSize: '0.9rem', fontWeight: 500 }}>Bật (Active) hiển thị ra trang chủ</label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thông tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManagePage;

