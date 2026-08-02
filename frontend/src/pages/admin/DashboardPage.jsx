import React, { useState, useEffect } from 'react';
import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];
const STATUS_COLORS = {
    pending: '#FFBB28',
    confirmed: '#0088FE',
    shipping: '#00C49F',
    delivered: '#3b82f6',
    cancelled: '#ef4444',
    returned: '#a855f7'
};

const STATUS_LABELS = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
    returned: 'Đổi trả'
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orderStats, setOrderStats] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [productStats, setProductStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats concurrently. 
                // Using allSettled so if one fails (e.g. userStats for staff), others still resolve.
                const results = await Promise.allSettled([
                    api.get('/orders/stats'),
                    user.role === 'admin' ? api.get('/users/stats') : Promise.resolve({ data: null }),
                    api.get('/products/stats')
                ]);

                if (results[0].status === 'fulfilled') setOrderStats(results[0].value.data);
                if (results[1].status === 'fulfilled' && results[1].value.data) setUserStats(results[1].value.data);
                if (results[2].status === 'fulfilled') setProductStats(results[2].value.data);

                // Check for errors
                const failed = results.filter(r => r.status === 'rejected');
                if (failed.length > 0) {
                    toast.error('Có lỗi khi tải một số dữ liệu thống kê');
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error('Lỗi khi tải dữ liệu trang tổng quan');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user.role]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner />
            </div>
        );
    }

    // Prepare PieChart Data
    const pieData = orderStats?.orders_by_status
        ? Object.entries(orderStats.orders_by_status)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({ key: status, name: STATUS_LABELS[status] || status, value: count }))
        : [];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Chào mừng trở lại, {user.name}!</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <StatCard
                    title="Tổng Doanh Thu"
                    value={formatCurrency(orderStats?.total_revenue || 0)}
                    icon={<DollarSign color="#10b981" />}
                    color="#10b981"
                />
                <StatCard
                    title="Tổng Đơn Hàng"
                    value={orderStats?.total_orders || 0}
                    icon={<ShoppingCart color="#3b82f6" />}
                    color="#3b82f6"
                />
                <StatCard
                    title="Sản Phẩm"
                    value={productStats?.total_products || 0}
                    icon={<Package color="#f59e0b" />}
                    color="#f59e0b"
                />
                {user.role === 'admin' && (
                    <StatCard
                        title="Người Dùng"
                        value={userStats?.total_users || 0}
                        icon={<Users color="#8b5cf6" />}
                        color="#8b5cf6"
                    />
                )}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Revenue Area Chart */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Biểu đồ Doanh Thu</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                        {orderStats?.revenue_by_month?.length > 0 ? (
                            <ResponsiveContainer>
                                <AreaChart data={[...orderStats.revenue_by_month].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        fontSize={12}
                                        tickFormatter={(val) => `${val / 1000000}M`}
                                    />
                                    <RechartsTooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders Pie Chart */}
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Tỷ lệ Trạng thái</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key] || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders and Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Đơn Hàng Gần Đây</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Mã Đơn</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Khách Hàng</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Tổng Tiền</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderStats?.recent_orders?.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{order.order_number}</td>
                                        <td style={{ padding: '0.75rem' }}>{order.customer_name}</td>
                                        <td style={{ padding: '0.75rem' }}>{formatCurrency(order.total)}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                backgroundColor: STATUS_COLORS[order.status] + '33',
                                                color: STATUS_COLORS[order.status]
                                            }}>
                                                {(STATUS_LABELS[order.status] || order.status).toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Alerts */}
                    <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Cảnh Báo</h3>

                        {productStats?.low_stock_variants > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                                <AlertCircle color="#ef4444" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#991b1b', margin: 0 }}>Kho Sắp Hết</p>
                                    <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: 0 }}>Có {productStats.low_stock_variants} biến thể sản phẩm dưới 10 chiếc.</p>
                                </div>
                            </div>
                        )}
                        {!productStats?.low_stock_variants || productStats?.low_stock_variants === 0 ? (
                            <div className="text-gray-500 text-sm">Không có cảnh báo mới.</div>
                        ) : null}
                    </div>

                    {user.role === 'admin' && (
                        <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Tăng trưởng</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '50%' }}>
                                    <TrendingUp color="#10b981" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>+{userStats?.new_users_this_month || 0}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Người dùng mới tháng này</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div style={{
        backgroundColor: 'var(--color-surface)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '1.25rem'
    }}>
        <div style={{
            width: '50px', height: '50px',
            borderRadius: '12px',
            backgroundColor: `${color}22`,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            {icon}
        </div>
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{value}</h3>
        </div>
    </div>
);

const Spinner = () => (
    <div style={{
        width: '40px', height: '40px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }}>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
);

export default DashboardPage;
