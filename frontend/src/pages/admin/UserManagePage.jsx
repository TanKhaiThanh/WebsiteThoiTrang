import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, ShieldCheck, MoreVertical, Edit, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const UserManagePage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;

            const response = await api.get('/users', { params });
            // Laravel paginator object
            setUsers(response.data.data || []);
            setTotalPages(response.data.last_page || 1);
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Lỗi khi tải danh sách người dùng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]); // Trigger refetch on page or filter change

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset page on new search
        fetchUsers();
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Bạn có chắc chắn thay đổi chức vụ thành ${newRole.toUpperCase()} cho user này?`)) return;

        setUpdatingId(userId);
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            toast.success('Cập nhật chức vụ thành công');
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi cập nhật chức vụ');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleBan = async (userId, isBanned) => {
        const action = isBanned ? 'MỞ KHÓA' : 'KHÓA';
        if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

        setUpdatingId(userId);
        try {
            await api.put(`/users/${userId}/ban`);
            toast.success(`${action} tài khoản thành công`);
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u));
        } catch (error) {
            toast.error(error.response?.data?.error || `Lỗi khi ${action} tài khoản`);
        } finally {
            setUpdatingId(null);
        }
    };

    const ROLE_LABELS = {
        admin: { label: 'Admin', color: 'var(--color-error)' },
        staff: { label: 'Staff', color: 'var(--color-primary)' },
        shipper: { label: 'Shipper', color: 'var(--color-accent)' },
        customer: { label: 'Customer', color: 'var(--color-text-muted)' }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Người Dùng</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Quản lý tài khoản và phân quyền hệ thống</p>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                backgroundColor: 'var(--color-surface)', padding: '1rem',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                flexWrap: 'wrap'
            }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, minWidth: '250px', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo Tên hoặc Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                                border: '1px solid var(--color-border)', borderRadius: '6px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Tìm</button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} color="var(--color-text-muted)" />
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none' }}
                    >
                        <option value="">Tất cả chức vụ</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="shipper">Shipper</option>
                        <option value="customer">Customer</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Người dùng</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Chức vụ</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng thái</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Không tìm thấy người dùng nào.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: updatingId === user.id ? 0.5 : 1 }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>#{user.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={updatingId === user.id}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                border: `1px solid ${ROLE_LABELS[user.role]?.color || '#ccc'}`,
                                                color: ROLE_LABELS[user.role]?.color || 'inherit',
                                                fontWeight: 600,
                                                outline: 'none',
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="shipper">Shipper</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.is_banned ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <ShieldAlert size={14} /> Bị Khóa
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <ShieldCheck size={14} /> Hoạt động
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleToggleBan(user.id, user.is_banned)}
                                            disabled={updatingId === user.id || user.role === 'admin'}
                                            title={user.role === 'admin' ? "Không thể khóa Admin" : (user.is_banned ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản')}
                                            style={{
                                                background: 'none', border: 'none', cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                                                color: user.is_banned ? 'var(--color-primary)' : 'var(--color-error)',
                                                opacity: user.role === 'admin' ? 0.3 : 1
                                            }}
                                        >
                                            {user.is_banned ? <UserCheck size={20} /> : <UserX size={20} />}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid var(--color-border)', gap: '0.5rem' }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            Trang Trước
                        </button>
                        <span style={{ padding: '0.25rem 0.5rem', fontWeight: 500 }}>
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                        >
                            Trang Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagePage;
