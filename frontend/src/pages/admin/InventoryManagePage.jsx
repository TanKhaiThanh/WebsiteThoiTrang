import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Package, X, PlusCircle, MinusCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const InventoryManagePage = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedProducts, setExpandedProducts] = useState(new Set());

    // Modal states
    const [transactionModal, setTransactionModal] = useState({ show: false, type: 'in', variant: null });
    const [historyModal, setHistoryModal] = useState({ show: false, variant: null, logs: [], loading: false });
    const [formQty, setFormQty] = useState(1);
    const [formNote, setFormNote] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (search) params.search = search;

            const response = await api.get('/products', { params });
            setProducts(response.data.data || []);
            setTotalPages(response.data.last_page || 1);
        } catch (error) {
            console.error('Fetch inventory error:', error);
            toast.error('Lỗi khi tải dữ liệu kho.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchInventory();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    useEffect(() => {
        if (page > 1) fetchInventory();
    }, [page]);

    const toggleExpand = (id) => {
        setExpandedProducts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (formQty < 1) return toast.error('Số lượng không hợp lệ');

        setFormLoading(true);
        try {
            const { variant, type } = transactionModal;
            await api.put(`/inventory/${variant.id}`, {
                type,
                quantity: formQty,
                note: formNote
            });
            toast.success('Cập nhật tồn kho thành công');

            setProducts(prevProducts => prevProducts.map(p => {
                const updatedVariants = p.variants?.map(v =>
                    v.id === variant.id
                        ? { ...v, inventory: { ...v.inventory, available_qty: type === 'in' ? (v.inventory.available_qty + parseInt(formQty)) : (v.inventory.available_qty - parseInt(formQty)) } }
                        : v
                );
                return { ...p, variants: updatedVariants };
            }));

            setTransactionModal({ show: false, type: 'in', variant: null });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi cập nhật kho');
        } finally {
            setFormLoading(false);
        }
    };

    const handleViewHistory = async (variant) => {
        setHistoryModal({ show: true, variant, logs: [], loading: true });
        try {
            const res = await api.get(`/inventory/${variant.id}/transactions`);
            setHistoryModal({ show: true, variant, logs: res.data.data || [], loading: false });
        } catch (error) {
            toast.error('Lỗi khi tải lịch sử');
            setHistoryModal({ show: false, variant: null, logs: [], loading: false });
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Quản lý Tồn Kho</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cập nhật số lượng khả dụng của từng mặt hàng</p>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                backgroundColor: 'var(--color-surface)', padding: '1rem',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', flex: 1, minWidth: '300px', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm SP (Mã SKU, Tên)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem',
                                border: '1px solid var(--color-border)', borderRadius: '6px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Mã SKU</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sản phẩm</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Biến thể</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng thái</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Tồn kho</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Đã đặt (Reserve)</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Thao tác kho hàng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && products.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Không có dữ liệu tồn kho.</td></tr>
                        ) : (
                            products.map(product => {
                                const isExpanded = expandedProducts.has(product.id);
                                const totalQty = product.variants?.reduce((sum, v) => sum + (v.inventory?.available_qty || 0), 0) || 0;
                                const totalReservedQty = product.variants?.reduce((sum, v) => sum + (v.inventory?.reserved_qty || 0), 0) || 0;
                                const isLowProductLevel = product.variants?.some(v => (v.inventory?.available_qty || 0) <= 10);

                                return (
                                    <React.Fragment key={product.id}>
                                        <tr
                                            onClick={() => toggleExpand(product.id)}
                                            style={{ backgroundColor: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }}
                                        >
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }} colSpan="2">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                                                    <span style={{ fontSize: '1.05rem' }}>{product.name}</span>
                                                    {isLowProductLevel && (
                                                        <span style={{ display: 'inline-flex', padding: '0.15rem 0.4rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                                            Cần chú ý
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                    {product.category?.name || 'Vô danh'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{product.variants?.length || 0} biến thể</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalQty}</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalReservedQty}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}></td>
                                        </tr>
                                        {isExpanded && product.variants?.map(variant => {
                                            const qty = variant.inventory?.available_qty || 0;
                                            const vLow = qty <= 10;
                                            return (
                                                <tr key={variant.id} style={{ backgroundColor: vLow ? '#fff5f5' : 'white', borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '0.75rem 1rem 0.75rem 3.5rem', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>{variant.sku}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}></td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <div style={{ display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                            {variant.color} - {variant.size}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {vLow ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                <AlertTriangle size={14} /> Sắp hết
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                <CheckCircle size={14} /> An toàn
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1.1rem', display: 'inline-block', minWidth: '40px', padding: '0.1rem 0.4rem', backgroundColor: '#f8fafc', color: '#334155', borderRadius: '4px' }}>{qty}</span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '1rem', display: 'inline-block', minWidth: '40px', padding: '0.1rem 0.4rem', backgroundColor: '#fff7ed', color: '#d97706', borderRadius: '4px' }}>
                                                            {variant.inventory?.reserved_qty || 0}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFormQty(1); setFormNote(''); setTransactionModal({ show: true, type: 'in', variant: { ...variant, product_name: product.name } }); }}
                                                                style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #10b981', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
                                                            >
                                                                <PlusCircle size={14} /> Nhập
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFormQty(1); setFormNote(''); setTransactionModal({ show: true, type: 'out', variant: { ...variant, product_name: product.name } }); }}
                                                                style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
                                                            >
                                                                <MinusCircle size={14} /> Xuất
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleViewHistory(variant); }}
                                                                style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                                                            >
                                                                <Clock size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>

            {/* TRANSACTION MODAL */}
            {transactionModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: transactionModal.type === 'in' ? '#059669' : '#dc2626' }}>
                                {transactionModal.type === 'in' ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho'}
                            </h2>
                            <button onClick={() => setTransactionModal({ show: false, type: 'in', variant: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleTransactionSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Mã SKU: <span style={{ fontWeight: 600, color: 'black' }}>{transactionModal.variant.sku}</span></div>
                                <div style={{ fontWeight: 500, marginTop: '4px' }}>{transactionModal.variant.product_name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{transactionModal.variant.color} - {transactionModal.variant.size}</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Số lượng {transactionModal.type === 'in' ? 'nhập thêm' : 'xuất đi'}
                                </label>
                                <input
                                    type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '1.1rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Lý do / Ghi chú {transactionModal.type === 'out' && <span style={{ color: 'red' }}>*</span>}</label>
                                <textarea
                                    required={transactionModal.type === 'out'} rows="3" value={formNote} onChange={e => setFormNote(e.target.value)}
                                    placeholder={transactionModal.type === 'in' ? "Vd: Hàng trả về, lô hàng mới..." : "Vd: Hàng lỗi, mất trong kho..."}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setTransactionModal({ show: false, type: 'in', variant: null })} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: 'transparent' }}>Hủy</button>
                                <button type="submit" disabled={formLoading} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', backgroundColor: transactionModal.type === 'in' ? '#059669' : '#dc2626', color: 'white', border: 'none', cursor: formLoading ? 'wait' : 'pointer', fontWeight: 600 }}>
                                    {formLoading ? 'Đang lưu...' : 'Xác nhận xử lý'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {historyModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Thống Kê Nhập/Xuất: <span style={{ color: 'var(--color-primary)' }}>{historyModal.variant.sku}</span>
                            </h2>
                            <button onClick={() => setHistoryModal({ show: false, variant: null, logs: [], loading: false })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            {historyModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải lịch sử...</div>
                            ) : historyModal.logs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Chưa có giao dịch kho nào.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ borderBottom: '2px solid var(--color-border)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>Thời gian</th>
                                            <th style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>Loại</th>
                                            <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', textAlign: 'right' }}>Thay đổi</th>
                                            <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', textAlign: 'right' }}>Tồn cuối</th>
                                            <th style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyModal.logs.map((log) => {
                                            const isImport = log.type === 'in' || log.type === 'set';
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                                                        {new Date(log.created_at).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: isImport ? '#ecfdf5' : '#fef2f2', color: isImport ? '#059669' : '#dc2626' }}>
                                                            {log.type === 'in' ? 'Nhập' : log.type === 'out' ? 'Xuất' : 'Khởi tạo'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: isImport ? '#059669' : '#dc2626' }}>
                                                        {isImport ? '+' : '-'}{log.quantity_changed}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                                                        {log.balance_after}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                                                        {log.note || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagePage;
