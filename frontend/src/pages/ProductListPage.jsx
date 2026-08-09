import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../services/api';
import CustomCheckbox from '../components/CustomCheckbox';
import PriceRangeSlider from '../components/PriceRangeSlider';
import { useWishlist } from '../context/WishlistContext';

const sizeOrderMap = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7, 'FREESIZE': 8 };

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const { toggleWishlist, isWishlisted } = useWishlist();

    const loadMoreProducts = async () => {
        if (!pagination || pagination.current_page >= pagination.last_page) return;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams(location.search);
            params.set('page', pagination.current_page + 1);
            const res = await api.get(`/products?${params.toString()}`);

            // Xóa duplicate nhỡ lúc load bị trùng lặp thời gian thực
            setProducts(prev => {
                const newProducts = res.data.data;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewProducts];
            });
            setPagination(res.data);
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Dynamic Filter Data from Backend
    const [categories, setCategories] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);

    const location = useLocation();
    const navigate = useNavigate();

    // Parse URL Params into State
    const searchParams = new URLSearchParams(location.search);
    const initialCategories = searchParams.get('category_id') ? searchParams.get('category_id').split(',') : [];
    const initialSizes = searchParams.get('sizes') ? searchParams.get('sizes').split(',') : [];
    const initialColors = searchParams.get('colors') ? searchParams.get('colors').split(',') : [];
    const initialMinPrice = searchParams.get('min_price') || 0;
    const initialMaxPrice = searchParams.get('max_price') || 5000000;
    const initialSort = searchParams.get('sort') || 'created_at';
    const initialOrder = searchParams.get('order') || 'desc';

    const [selectedCategories, setSelectedCategories] = useState(initialCategories);
    const [selectedSizes, setSelectedSizes] = useState(initialSizes);
    const [selectedColors, setSelectedColors] = useState(initialColors);
    const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice]);
    const [sortBy, setSortBy] = useState(`${initialSort}_${initialOrder}`);

    // Accordion State (Auto-expand if loaded from URL)
    const [expandedCategories, setExpandedCategories] = useState(initialCategories.map(Number));

    const toggleExpand = (id) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    // Fetch Base Options once
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const catRes = await api.get('/categories');
                const filRes = await api.get('/products/filters');

                const fetchedCategories = catRes.data.categories || [];
                setCategories(fetchedCategories);
                setExpandedCategories(prev => {
                    const allCatIds = fetchedCategories.map(c => c.id);
                    return [...new Set([...prev, ...allCatIds])];
                });

                const rawSizes = filRes.data.sizes || [];
                const sortedSizes = rawSizes.sort((a, b) => {
                    return (sizeOrderMap[a.toUpperCase()] || 99) - (sizeOrderMap[b.toUpperCase()] || 99);
                });
                setAvailableSizes(sortedSizes);

                setAvailableColors(filRes.data.colors || []);
            } catch (error) {
                console.error('Lỗi tải metadata filter', error);
            }
        };
        fetchFilters();
    }, []);

    // Sync State with URL (For Header links navigation)
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        const newCats = params.get('category_id') ? params.get('category_id').split(',') : [];
        setSelectedCategories(newCats);

        // Cập nhật Expanded Categories dựa trên danh mục vừa được chọn từ Menu
        if (newCats.length > 0) {
            setExpandedCategories(prev => {
                const numericCats = newCats.map(Number);
                return [...new Set([...prev, ...numericCats])]; // Lọc trùng lặp
            });
        }

        setSelectedSizes(params.get('sizes') ? params.get('sizes').split(',') : []);
        setSelectedColors(params.get('colors') ? params.get('colors').split(',') : []);
        setPriceRange([params.get('min_price') || 0, params.get('max_price') || 5000000]);
        setSortBy(`${params.get('sort') || 'created_at'}_${params.get('order') || 'desc'}`);
    }, [location.search]);

    // Perform Search when URL changes
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Ensure query matches the latest URL
                const res = await api.get(`/products${location.search}`);
                setProducts(res.data.data);
                setPagination(res.data);
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [location.search]);

    // Apply Filters -> Push to URL
    const applyFilters = (newCats, newSizes, newColors, newPrice, newSortStr) => {
        const params = new URLSearchParams();

        if (newCats.length > 0) params.append('category_id', newCats.join(','));
        if (newSizes.length > 0) params.append('sizes', newSizes.join(','));
        if (newColors.length > 0) params.append('colors', newColors.join(','));

        if (newPrice[0] > 0) params.append('min_price', newPrice[0]);
        if (newPrice[1] < 5000000) params.append('max_price', newPrice[1]);

        if (newSortStr) {
            let s = 'created_at';
            let o = 'desc';
            if (newSortStr === 'price_asc') { s = 'price'; o = 'asc'; }
            if (newSortStr === 'price_desc') { s = 'price'; o = 'desc'; }

            params.append('sort', s);
            params.append('order', o);
        }

        navigate({ search: params.toString() });
    };

    const toggleCategory = (id) => {
        const current = [...selectedCategories];
        const idx = current.indexOf(id.toString());
        if (idx === -1) current.push(id.toString());
        else current.splice(idx, 1);
        setSelectedCategories(current);
        applyFilters(current, selectedSizes, selectedColors, priceRange, sortBy);
    };

    const toggleSize = (size) => {
        const current = [...selectedSizes];
        const idx = current.indexOf(size);
        if (idx === -1) current.push(size);
        else current.splice(idx, 1);
        setSelectedSizes(current);
        applyFilters(selectedCategories, current, selectedColors, priceRange, sortBy);
    };

    const toggleColor = (color) => {
        const current = [...selectedColors];
        const idx = current.indexOf(color);
        if (idx === -1) current.push(color);
        else current.splice(idx, 1);
        setSelectedColors(current);
        applyFilters(selectedCategories, selectedSizes, current, priceRange, sortBy);
    };

    const handleSortChange = (e) => {
        const s = e.target.value;
        setSortBy(s);
        applyFilters(selectedCategories, selectedSizes, selectedColors, priceRange, s);
    };

    // Helper functions
    const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';
    const getFinalImageUrl = (url) => {
        if (!url) return '';
        let parsedUrl = url;
        if (url.includes('/storage/uploads/products/')) parsedUrl = url.replace('/storage/uploads/products/', '/api/media/image/');
        if (url.includes('/storage/uploads/banners/')) parsedUrl = url.replace('/storage/uploads/banners/', '/api/media/image/');
        if (parsedUrl.startsWith('http')) return parsedUrl;

        if (import.meta.env && import.meta.env.PROD) return parsedUrl;

        const baseUrl = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return baseUrl + parsedUrl;
    };

    const renderCategoryTree = (catList, level = 0) => {
        return (
            <ul style={{ listStyle: 'none', padding: level === 0 ? 0 : '0 0 0 1.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: level === 0 ? '1rem' : '0.6rem' }}>
                {catList.map(cat => {
                    const isExpanded = expandedCategories.includes(cat.id);
                    const hasChildren = cat.children && cat.children.length > 0;
                    return (
                        <li key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <CustomCheckbox
                                        id={`cat-${cat.id}`}
                                        label={level === 0 ? <strong style={{ fontSize: '0.95rem' }}>{cat.name}</strong> : <span style={{ color: level === 1 ? '#4b5563' : '#6b7280', fontSize: level === 1 ? '0.9rem' : '0.85rem' }}>{cat.name}</span>}
                                        checked={selectedCategories.includes(cat.id.toString())}
                                        onChange={() => toggleCategory(cat.id.toString())}
                                    />
                                </div>
                                {hasChildren && (
                                    <button
                                        onClick={() => toggleExpand(cat.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem', color: '#6b7280' }}
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                )}
                            </div>
                            {hasChildren && isExpanded && renderCategoryTree(cat.children, level + 1)}
                        </li>
                    )
                })}
            </ul>
        );
    };

    return (
        <div style={{ backgroundColor: '#fff', color: '#111' }}>
            {/* HERO SECTION / HEADER */}
            <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#6b7280', marginBottom: '1.5rem' }}>
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link> <span style={{ margin: '0 0.5rem' }}>/</span>
                    <span style={{ color: '#111', fontWeight: 600 }}>Sản phẩm</span>
                </div>

                <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', margin: '0 0 1rem 0', fontWeight: 500, letterSpacing: '-1px' }}>
                    Tất cả sản phẩm
                </h1>

                <p style={{ maxWidth: '600px', fontSize: '0.95rem', lineHeight: 1.6, color: '#4b5563' }}>
                    Khám phá sự giao thoa giữa nghệ thuật may mặc truyền thống và tư duy thiết kế hiện đại. Mỗi sản phẩm là một tuyên ngôn về đẳng cấp và sự tinh tế dành riêng cho giới thượng lưu.
                </p>
            </div>

            {/* MAIN CONTENT */}
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '4rem', paddingTop: '3rem', paddingBottom: '6rem' }}>

                {/* SIDEBAR FILTERS */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Danh mục */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Phân loại</h3>
                        {renderCategoryTree(categories)}
                    </div>

                    {/* Kích thước */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Kích thước</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {availableSizes.length === 0 ? <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Đang tải...</span> : null}
                            {availableSizes.map(size => {
                                const isActive = selectedSizes.includes(size);
                                return (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        style={{
                                            border: `1px solid ${isActive ? '#111' : '#d1d5db'}`,
                                            backgroundColor: isActive ? '#111' : '#fff',
                                            color: isActive ? '#fff' : '#4b5563',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Màu sắc */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Màu sắc</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {availableColors.length === 0 ? <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Đang tải...</span> : null}
                            {availableColors.map(color => {
                                const isActive = selectedColors.includes(color);
                                // A smart way to parse simple colors vs Hex. We render a circle.
                                // If color name is 'Trắng', we map it to '#fff'. (Basic mapping fallback)
                                const colorMap = { 'trắng': '#ffffff', 'đen': '#000000', 'đỏ': '#ef4444', 'xanh': '#3b82f6', 'xanh lá': '#16a34a', 'vàng': '#eab308', 'be': '#f4ebd8', 'tím than': '#1e3a8a', 'hồng': '#ec4899', 'nâu': '#78350f', 'cam': '#f97316', 'xám': '#9ca3af', 'tím': '#8b5cf6' };
                                const displayColor = color.startsWith('#') ? color : (colorMap[color.toLowerCase()] || '#a1a1aa');

                                return (
                                    <button
                                        key={color}
                                        onClick={() => toggleColor(color)}
                                        title={color}
                                        style={{
                                            border: isActive ? '2px solid #111' : '1px solid #e5e7eb',
                                            backgroundColor: displayColor,
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            padding: 0,
                                            outlineOffset: '2px',
                                            outline: isActive ? '1px solid #111' : 'none'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Giá tiền */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Giá (VNĐ)</h3>
                        <div style={{ padding: '0 0.5rem' }}>
                            <PriceRangeSlider
                                min={0}
                                max={5000000}
                                value={priceRange}
                                onChange={(value) => setPriceRange(value)}
                                onChangeComplete={(value) => {
                                    applyFilters(selectedCategories, selectedSizes, selectedColors, value, sortBy);
                                }}
                            />
                        </div>
                    </div>
                </aside>

                {/* PRODUCT GRID */}
                <div>
                    {/* Tool Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase', color: '#4b5563' }}>
                            HIỂN THỊ {products.length} {pagination && pagination.total > products.length ? `TRÊN ${pagination.total}` : ''} SẢN PHẨM
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}>Sắp xếp:</span>
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                style={{ border: 'none', outline: 'none', borderBottom: '1px solid #e5e7eb', padding: '0.2rem 1.5rem 0.2rem 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', appearance: 'none', background: 'transparent' }}
                            >
                                <option value="created_at_desc">Mới nhất</option>
                                <option value="price_asc">Giá (Thấp đến Cao)</option>
                                <option value="price_desc">Giá (Cao xuống Thấp)</option>
                            </select>
                        </div>
                    </div>

                    {/* Loading State / Empty / Products */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9ca3af', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontStyle: 'italic' }}>
                            Đang tải sản phẩm...
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9ca3af', fontSize: '1rem' }}>
                            Không có sản phẩm nào phù hợp với bộ lọc hiện tại.
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                {products.map(product => (
                                    <div key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: '#f9fafb', overflow: 'hidden', marginBottom: '1rem' }}>
                                            <Link to={`/products/${product.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                                                <img
                                                    src={product.primary_image ? getFinalImageUrl(product.primary_image.url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`}
                                                    alt={product.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            </Link>
                                            {product.sale_price && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#ca8a04', color: '#fff', padding: '6px 16px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', pointerEvents: 'none', zIndex: 5 }}>
                                                    Sale
                                                </div>
                                            )}
                                            <button
                                                title="Thêm vào yêu thích"
                                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s', zIndex: 10 }}
                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                                            >
                                                <Heart size={16} strokeWidth={2} color={isWishlisted(product.id) ? '#e63946' : '#111'} fill={isWishlisted(product.id) ? '#e63946' : 'none'} />
                                            </button>
                                        </div>

                                        <Link to={`/products/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{product.name}</h3>
                                        </Link>

                                        <div style={{ color: '#ca8a04', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px' }}>
                                            {product.sale_price ? (
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <span>{new Intl.NumberFormat('vi-VN').format(product.sale_price)} VNĐ</span>
                                                    <span style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.8rem', fontWeight: 400 }}>{new Intl.NumberFormat('vi-VN').format(product.price)} VNĐ</span>
                                                </div>
                                            ) : (
                                                <span>{new Intl.NumberFormat('vi-VN').format(product.price)} VNĐ</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Load More Real */}
                            {pagination && pagination.current_page < pagination.last_page && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                                    <button
                                        onClick={loadMoreProducts}
                                        disabled={loadingMore}
                                        style={{ border: '1px solid #111', background: 'transparent', padding: '1rem 3rem', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', cursor: loadingMore ? 'wait' : 'pointer', opacity: loadingMore ? 0.7 : 1, transition: 'all 0.3s' }}
                                        onMouseOver={e => { if (!loadingMore) { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff' } }}
                                        onMouseOut={e => { if (!loadingMore) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111' } }}>
                                        {loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}
                                    </button>
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


