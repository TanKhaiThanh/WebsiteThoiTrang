import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Parse query params for simple filtering
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/products${location.search}`);
                setProducts(res.data.data);
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [location.search]);

    return (
        <div className="container" style={{ padding: '4rem 0' }}>

            <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Bộ Sưu Tập</h1>

                {/* Simple Filter UI */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select className="form-input" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                        <option value="">Sắp xếp: Mới nhất</option>
                        <option value="price_asc">Giá: Thấp đến cao</option>
                        <option value="price_desc">Giá: Cao đến thấp</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '3rem' }}>
                {/* Sidebar Filters */}
                <aside>
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ mb: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Danh Mục</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <li><Link to="/products">Tất cả sản phẩm</Link></li>
                            <li><Link to="/products?category_id=1">Thời Trang Nam</Link></li>
                            <li><Link to="/products?category_id=4">Thời Trang Nữ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ mb: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Khoảng Giá</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <li>Dưới 500,000đ</li>
                            <li>500,000đ - 1,000,000đ</li>
                            <li>Trên 1,000,000đ</li>
                        </ul>
                    </div>
                </aside>

                {/* Product Grid */}
                <div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>Đang tải danh sách sản phẩm...</div>
                    ) : (
                        <>
                            {products.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem 0' }}>
                                    Không tìm thấy sản phẩm nào.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    {products.map(product => (
                                        <div key={product.id} className="product-card">
                                            <Link to={`/products/${product.id}`} className="product-image-wrap">
                                                <img
                                                    src={product.primary_image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                                                    alt={product.name}
                                                    className="product-image"
                                                />
                                                {product.sale_price && (
                                                    <div style={{
                                                        position: 'absolute', top: '10px', left: '10px',
                                                        background: 'var(--color-error)', color: '#fff',
                                                        padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                                                    }}>
                                                        Sale
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="product-info">
                                                <div className="product-brand">{product.brand || 'ASMAW'}</div>
                                                <Link to={`/products/${product.id}`}>
                                                    <h3 className="product-name">{product.name}</h3>
                                                </Link>
                                                <div>
                                                    {product.sale_price ? (
                                                        <>
                                                            <span className="product-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}</span>
                                                            <span className="product-price-old">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="product-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductListPage;
