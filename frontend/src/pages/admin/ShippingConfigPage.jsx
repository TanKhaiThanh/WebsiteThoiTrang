import React, { useState, useEffect } from 'react';
import { Save, Truck, Activity } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const ShippingConfigPage = () => {
    const [settings, setSettings] = useState({
        zone_1_fee: 15000,
        zone_2_fee: 25000,
        zone_3_fee: 35000,
        zone_4_fee: 45000,
        free_shipping_threshold: 500000,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // api tự pass JWT => middleware sẽ check Auth và Role admin.
                const res = await api.get('/shipping/settings');
                if (res.data) {
                    setSettings({
                        zone_1_fee: res.data.zone_1_fee ?? 15000,
                        zone_2_fee: res.data.zone_2_fee ?? 25000,
                        zone_3_fee: res.data.zone_3_fee ?? 35000,
                        zone_4_fee: res.data.zone_4_fee ?? 45000,
                        free_shipping_threshold: res.data.free_shipping_threshold ?? 500000,
                    });
                }
            } catch (error) {
                toast.error('Không thể tải Cài đặt giao hàng');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/shipping/settings', settings);
            toast.success('Lưu cấu hình phí vận chuyển thành công!');
        } catch (error) {
            toast.error('Lỗi khi lưu cấu hình: ' + (error.response?.data?.error || 'Vui lòng thử lại'));
        } finally {
            setSaving(false);
        }
    };

    const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải biểu phí cơ sở...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Truck size={32} color="var(--color-primary)" />
                        Giao Hàng & Biểu Phí
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        Quản lý định mức Tự động tính tiền Ship cho Phân hệ Thanh Toán
                    </p>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f8fafc' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Bảng Cấu Hình Mức Phí Tính Theo Phân Vùng Chỉ Định (Geo-Zoning)</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                        Hệ thống nội suy vùng tự động bằng thuật toán AI quét Tên Phường/Xã trên hoá đơn Khách Hàng. Cửa hàng gốc: <b>Phường Bến Thành.</b>
                    </p>
                </div>

                <div style={{ padding: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Vùng 1 (Nội & Ngoại Thành TPHCM) - Phí VNĐ</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Áp dụng cho toàn bộ khu vực thuộc Thành Phố Hồ Chí Minh.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" name="zone_1_fee" value={formatVND(settings.zone_1_fee)} onChange={handleChange} className="form-input" style={{ width: '200px' }} />
                            <span style={{ fontWeight: 600 }}>₫</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Vùng 2 (Vùng Giáp Ranh TP.HCM) - Phí VNĐ</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Các tỉnh cận Thành Phố Hồ Chí Minh như Bình Dương, Đồng Nai, Long An...</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" name="zone_2_fee" value={formatVND(settings.zone_2_fee)} onChange={handleChange} className="form-input" style={{ width: '200px' }} />
                            <span style={{ fontWeight: 600 }}>₫</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Vùng 3 (Miền Nam, Nam Trung Bộ & Tây Nguyên) - Phí VNĐ</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Cần Thơ, Đà Nẵng, Khánh Hoà, Tiền Giang, Gia Lai...</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" name="zone_3_fee" value={formatVND(settings.zone_3_fee)} onChange={handleChange} className="form-input" style={{ width: '200px' }} />
                            <span style={{ fontWeight: 600 }}>₫</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Vùng 4 (Toàn bộ miền Bắc & Vùng Cao) - Phí VNĐ</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Hà Nội, Hải Phòng, Lào Cai, Sơn La...</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" name="zone_4_fee" value={formatVND(settings.zone_4_fee)} onChange={handleChange} className="form-input" style={{ width: '200px' }} />
                            <span style={{ fontWeight: 600 }}>₫</span>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)', marginBottom: '2rem' }} />

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={18} />
                            Hạn Mức Miễn Phí Vận Chuyển Vượt Rào (Freeship Threshold)
                        </label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Khách hàng sẽ Tự Động bị hủy bỏ Tiền Giao Nhận nếu <b>TỔNG TIỀN MUA VƯỢT QUÁ</b> mốc giá trị dưới đây:
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="text" name="free_shipping_threshold" value={formatVND(settings.free_shipping_threshold)} onChange={handleChange} className="form-input" style={{ width: '250px', borderColor: 'var(--color-primary)', backgroundColor: '#fff', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '1.2rem' }}>₫</span>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}
                    >
                        {saving ? 'Đang Thiết Lập...' : <><Save size={20} /> Ban Hành Bảng Phí Mới</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShippingConfigPage;
