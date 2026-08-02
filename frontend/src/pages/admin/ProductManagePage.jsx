import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, CheckCircle, Tag, X, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import Pagination from '../../components/Pagination';

const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Fix Docker Windows Symlink by converting old /storage routes to direct /api/media stream
const getFinalImageUrl = (url) => {
    if (!url) return '';
    let parsedUrl = url.replace('/storage/uploads/products/', '/api/media/image/');
    return parsedUrl.startsWith('http') ? parsedUrl : `http://localhost:8000${parsedUrl}`;
};

// ==============================================
// 1. COMPONENT: PRODUCT FORM MODAL
// ==============================================
const ProductFormModal = ({ onClose, onSuccess, initialData, categories }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sale_price: '',
        category_id: '',
        brand: '',
        material: '',
        variants: [], // { id, color, size, sku, price_override, qty }
        images: [] // { file, url, color, is_primary }
    });

    const [isSale, setIsSale] = useState(false);

    // Variant config
    const [configColors, setConfigColors] = useState(['']); // Array of color names
    const [configSizes, setConfigSizes] = useState(['']); // Array of size names

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                price: initialData.price,
                sale_price: initialData.sale_price || '',
                category_id: initialData.category_id,
                brand: initialData.brand || '',
                material: initialData.material || '',
                variants: initialData.variants || [],
                images: initialData.images || []
            });
            setIsSale(!!initialData.sale_price);

            // Extract unique colors and sizes from existing variants
            if (initialData.variants) {
                const uniqueColors = [...new Set(initialData.variants.map(v => v.color))].filter(Boolean);
                const uniqueSizes = [...new Set(initialData.variants.map(v => v.size))].filter(Boolean);
                if (uniqueColors.length) setConfigColors(uniqueColors);
                if (uniqueSizes.length) setConfigSizes(uniqueSizes);
            }
        }
    }, [initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto generate variations from Colors and Sizes
    const generateVariants = () => {
        const newVariants = [];

        const capitalizeTitle = (str) => {
            return str.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
        };

        const cleanColors = [...new Set(configColors.map(c => capitalizeTitle(c.trim())).filter(Boolean))];
        const cleanSizes = [...new Set(configSizes.map(s => s.trim().toUpperCase()).filter(Boolean))];

        if (!cleanColors.length && !cleanSizes.length) {
            toast.error("Vui lòng điền tối thiểu 1 màu sắc hoặc 1 kích cỡ");
            return;
        }

        const colorsToUse = cleanColors.length > 0 ? cleanColors : [''];
        const sizesToUse = cleanSizes.length > 0 ? cleanSizes : [''];

        // Auto sku base
        let categoryCode = categories.find(c => c.id.toString() === formData.category_id.toString())?.slug || 'CAT';
        categoryCode = categoryCode.substring(0, 3).toUpperCase();

        // Remove accents for product name code
        let productCode = formData.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').substring(0, 5).toUpperCase() || 'PROD';

        colorsToUse.forEach(color => {
            sizesToUse.forEach(size => {
                const parts = [categoryCode, productCode];
                if (size) parts.push(size.toUpperCase());
                if (color) parts.push(color.toUpperCase().replace(/\s+/g, ''));
                const sku = parts.join('-');

                // check if exists to preserve qty
                const existing = formData.variants.find(v => v.color === color && v.size === size);

                newVariants.push(existing ? { ...existing, sku } : {
                    color, size, sku, price_override: '', qty: 0
                });
            });
        });

        setFormData(prev => ({ ...prev, variants: newVariants }));
        toast.success("Đã khởi tạo biến thể thành công!");
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        newVariants[index][field] = value;
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/') || file.size < 1024 * 1024) { // Only compress images > 1MB
                return resolve(file);
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let { width, height } = img;
                    const maxDim = 1200;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    }, 'image/jpeg', 0.82); // 82% quality
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageUpload = async (e, color) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        try {
            toast.loading("Đang xử lý và tải ảnh lên...");

            // Compress all files before uploading
            const compressedFiles = await Promise.all(files.map(f => compressImage(f)));

            const payload = new FormData();
            compressedFiles.forEach(f => payload.append('images[]', f));
            const res = await api.post('/media/upload-multiple', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss();

            const newImages = res.data.urls.map((url, idx) => ({
                url,
                color: color || '', // assigned to a variant color if provided
                is_primary: formData.images.length === 0 && idx === 0, // first ever img is primary
                sort_order: formData.images.length + idx
            }));

            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            toast.success("Tải ảnh lên thành công");
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi tải ảnh");
        }
    };

    const removeImage = (index) => {
        const updated = [...formData.images];
        updated.splice(index, 1);
        setFormData(prev => ({ ...prev, images: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                sale_price: isSale ? formData.sale_price : null
            };

            if (initialData?.id) {
                // Update
                await api.put(`/products/${initialData.id}`, payload);
                toast.success('Cập nhật sản phẩm thành công');
            } else {
                // Create
                await api.post('/products', payload);
                toast.success('Thêm sản phẩm thành công');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            const errs = error.response?.data?.errors;
            if (errs) {
                Object.values(errs).forEach(msg => toast.error(msg[0]));
            } else {
                toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const uniqueColorsInVariants = [...new Set(formData.variants.map(v => v.color))].filter(Boolean);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--color-surface)', width: '100%', maxWidth: '900px', height: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{initialData ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#f9fafb' }}>
                    <form id="productForm" onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>

                        {/* 1. Basic Info */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>1. Thông tin cơ bản</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên Sản Phẩm *</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Danh Mục *</label>
                                    <select required name="category_id" value={formData.category_id} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                        <option value="">Chọn danh mục</option>
                                        {(() => {
                                            const renderOptions = (cats, prefix = '') => {
                                                return cats.reduce((acc, c) => {
                                                    acc.push(<option key={c.id} value={c.id}>{prefix + c.name}</option>);
                                                    if (c.children?.length) {
                                                        acc = acc.concat(renderOptions(c.children, prefix + '-- '));
                                                    }
                                                    return acc;
                                                }, []);
                                            };
                                            return renderOptions(categories);
                                        })()}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thương hiệu</label>
                                    <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Giá Bán (VNĐ) *</label>
                                    <input required type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        <input type="checkbox" checked={isSale} onChange={e => setIsSale(e.target.checked)} style={{ marginRight: '8px' }} />
                                        Giá Khuyến Mãi (VNĐ)
                                    </label>
                                    <input type="number" min="0" disabled={!isSale} name="sale_price" value={formData.sale_price} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: !isSale ? '#f1f5f9' : 'white' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mô tả chi tiết</label>
                                    <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Variants Setup */}
                        {!initialData && (
                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>2. Thiết lập Biến Thể & SKU (Tạo Tự Động)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1rem' }}>

                                    {/* Colors */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Các màu sắc (Click '+' để thêm màu)</label>
                                        {configColors.map((c, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input type="text" placeholder="Trắng, Đen, Đỏ..." value={c} onChange={(e) => {
                                                    const newC = [...configColors]; newC[i] = e.target.value; setConfigColors(newC);
                                                }} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                                {i === configColors.length - 1 && (
                                                    <button type="button" onClick={() => setConfigColors([...configColors, ''])} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }}><Plus size={18} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sizes */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kích cỡ (S, M, L...)</label>
                                        {configSizes.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input type="text" placeholder="S, M, L..." value={s} onChange={(e) => {
                                                    const newS = [...configSizes]; newS[i] = e.target.value; setConfigSizes(newS);
                                                }} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                                {i === configSizes.length - 1 && (
                                                    <button type="button" onClick={() => setConfigSizes([...configSizes, ''])} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }}><Plus size={18} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="button" onClick={generateVariants} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    Tạo Biến Thể & Mã SKU Tự Động
                                </button>
                            </div>
                        )}

                        {/* Variants Table */}
                        {formData.variants.length > 0 && (
                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                                <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>Danh Sách Biến Thể</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                                            <th style={{ padding: '0.75rem' }}>Màu sắc</th>
                                            <th style={{ padding: '0.75rem' }}>Kích cỡ</th>
                                            <th style={{ padding: '0.75rem' }}>Mã SKU</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.variants.map((variant, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '0.75rem' }}>{variant.color}</td>
                                                <td style={{ padding: '0.75rem' }}>{variant.size}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input required type="text" value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    <button type="button" onClick={() => {
                                                        const newV = [...formData.variants]; newV.splice(index, 1); setFormData(prev => ({ ...prev, variants: newV }));
                                                    }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 3. Images Upload (Grouped by colors from variants) */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>3. Tải Ảnh Sản Phẩm (Theo Biến Thể Màu)</h3>

                            {/* General/Main Images (no specific color) */}
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Ảnh Chung (Hoặc Mặc định)</label>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {formData.images.filter(img => !img.color).map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #ccc', overflow: 'hidden' }}>
                                            <img src={getFinalImageUrl(img.url)} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removeImage(formData.images.findIndex(i => i.url === img.url))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>&times;</button>
                                        </div>
                                    ))}

                                    <label style={{ width: '100px', height: '100px', border: '2px dashed #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                        <Upload size={24} />
                                        <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Upload</span>
                                        <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, '')} />
                                    </label>
                                </div>
                            </div>

                            {/* Color specific Images */}
                            {uniqueColorsInVariants.map(color => (
                                <div key={color} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Ảnh Bản Màu: <span style={{ color: 'var(--color-primary)' }}>{color}</span></label>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {formData.images.filter(img => img.color === color).map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #ccc', overflow: 'hidden' }}>
                                                <img src={getFinalImageUrl(img.url)} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeImage(formData.images.findIndex(i => i.url === img.url))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>&times;</button>
                                            </div>
                                        ))}

                                        <label style={{ width: '100px', height: '100px', border: '2px dashed #9ca3af', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                            <Upload size={24} />
                                            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Upload</span>
                                            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, color)} />
                                        </label>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </form>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: 'white' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Hủy Bỏ</button>
                    <button type="submit" form="productForm" disabled={submitting} style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>
                        {submitting ? 'Đang Xử Lý...' : (initialData ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm')}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ==============================================
// 1.5. COMPONENT: CATEGORY FORM MODAL
// ==============================================
const CategoryFormModal = ({ onClose, onSuccess, categories, initialData }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', parent_id: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                parent_id: initialData.parent_id || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (initialData) {
                await api.put(`/categories/${initialData.id}`, formData);
                toast.success('Cập nhật danh mục thành công');
            } else {
                await api.post('/categories', formData);
                toast.success('Thêm danh mục thành công');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Flatten logic cho parent_id select
    const flattenCategories = (cats, prefix = '') => {
        let flat = [];
        cats.forEach(c => {
            flat.push({ id: c.id, label: prefix + c.name });
            if (c.children?.length) {
                flat = flat.concat(flattenCategories(c.children, prefix + '-- '));
            }
        });
        return flat;
    };
    const parentOptions = flattenCategories(categories);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{initialData ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên danh mục *</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thuộc danh mục cha</label>
                        <select value={formData.parent_id} onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                            <option value="">-- [ Không có ] Danh sách gốc --</option>
                            {parentOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mô tả ngắn gọn</label>
                        <textarea rows="3" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: 'transparent' }}>Hủy Bỏ</button>
                        <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Đang xử lý...' : (initialData ? 'Lưu Thay Đổi' : 'Xác Nhận Tạo')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ==============================================
// 2. MAIN PAGE EXPORT
// ==============================================
const ProductManagePage = () => {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Category Tree States
    const [expandedCategories, setExpandedCategories] = useState({});
    const toggleExpanded = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.categories || res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/manage/all?page=${page}&per_page=12`);
            setProducts(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        }
    }, [page, activeTab]);

    const handleCreateNew = () => {
        if (activeTab === 'products') {
            setEditingProduct(null);
            setShowProductModal(true);
        } else {
            setEditingCategory(null);
            setShowCategoryModal(true);
        }
    };

    const handleToggleActive = async (product) => {
        try {
            const newStatus = !product.is_active;
            await api.put(`/products/${product.id}`, { is_active: newStatus });
            toast.success(`Sản phẩm đã được ${newStatus ? 'Hiện' : 'Ẩn'}`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi cập nhật trạng thái");
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này vĩnh viễn?")) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success("Xóa sản phẩm thành công");
            fetchProducts();
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm");
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Kho Sản Phẩm</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Quản lý Sản phẩm, Phân bổ Biến thể và Danh mục hệ thống</p>
                </div>
                <button onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={20} />
                    {activeTab === 'products' ? 'Thêm Sản Phẩm' : 'Thêm Danh Mục'}
                </button>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        background: 'none', border: 'none', padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'products' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'products' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        marginBottom: '-2px'
                    }}>
                    Danh Sách Sản Phẩm
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                        background: 'none', border: 'none', padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'categories' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        marginBottom: '-2px'
                    }}>
                    Danh Mục Sản Phẩm
                </button>
            </div>

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === 'products' && (
                <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sản phẩm</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Kho / Biến thể</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Giá cơ bản</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Chưa có sản phẩm nào.</td></tr>
                            ) : (
                                products.map(product => {
                                    const totalQty = product.variants?.reduce((sum, v) => sum + (v.inventory?.available_qty || 0), 0) || 0;
                                    return (
                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: 60, height: 60, borderRadius: '8px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                                                    {product.primary_image ? (
                                                        <img src={getFinalImageUrl(product.primary_image.url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : <ImageIcon size={24} style={{ margin: '18px', color: '#9ca3af' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{product.name}</div>
                                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#475569' }}>
                                                        {product.category?.name || 'Vô danh'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{totalQty} sản phẩm</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{product.variants?.length || 0} biến thể</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: product.sale_price ? 'var(--color-error)' : 'inherit' }}>
                                                    {formatCurrency(product.sale_price || product.price)}
                                                </div>
                                                {product.sale_price && (
                                                    <div style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>
                                                        {formatCurrency(product.price)}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                    <button
                                                        onClick={() => handleToggleActive(product)}
                                                        style={{
                                                            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                                            backgroundColor: product.is_active !== false ? '#10b981' : '#e5e7eb',
                                                            position: 'relative', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center'
                                                        }}>
                                                        <div style={{
                                                            width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
                                                            position: 'absolute', left: product.is_active !== false ? '22px' : '4px', transition: 'left 0.2s',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                        }}></div>
                                                    </button>
                                                    <span style={{ fontSize: '0.75rem', color: product.is_active !== false ? '#10b981' : '#9ca3af', fontWeight: 600 }}>
                                                        {product.is_active !== false ? 'Đang Bán' : 'Đã Ẩn'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginRight: '1rem' }}>
                                                    <Edit size={20} />
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                </div>
            )}

            {/* TAB CONTENT: CATEGORIES */}
            {activeTab === 'categories' && (
                <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tên Danh Mục</th>
                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const renderRows = (cats, depth = 0) => {
                                    return cats.map(cat => {
                                        const hasChildren = cat.children && cat.children.length > 0;
                                        const isExpanded = expandedCategories[cat.id];
                                        return (
                                            <React.Fragment key={cat.id}>
                                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 500 }}>#{cat.id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 600, paddingLeft: `${1 + depth * 2}rem` }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {hasChildren ? (
                                                                <button
                                                                    onClick={() => toggleExpanded(cat.id)}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}
                                                                >
                                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                </button>
                                                            ) : (
                                                                <div style={{ width: '18px' }}></div>
                                                            )}
                                                            {depth > 0 && <span style={{ color: '#9ca3af', marginRight: '4px' }}>↳</span>}
                                                            <span>{cat.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <button onClick={() => {
                                                            setEditingCategory(cat);
                                                            setShowCategoryModal(true);
                                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginRight: '1rem' }}><Edit size={20} /></button>
                                                        <button onClick={() => {
                                                            if (window.confirm("Xóa danh mục này? Lưu ý: Nếu có danh mục con, chúng cũng có thể bị ảnh hưởng.")) {
                                                                api.delete(`/categories/${cat.id}`).then(() => {
                                                                    toast.success("Đã xóa danh mục");
                                                                    fetchCategories();
                                                                }).catch(() => toast.error("Lỗi xóa danh mục"));
                                                            }
                                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={20} /></button>
                                                    </td>
                                                </tr>
                                                {isExpanded && hasChildren && renderRows(cat.children, depth + 1)}
                                            </React.Fragment>
                                        );
                                    });
                                };
                                return renderRows(categories);
                            })()}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Category */}
            {showCategoryModal && (
                <CategoryFormModal
                    categories={categories}
                    initialData={editingCategory}
                    onClose={() => setShowCategoryModal(false)}
                    onSuccess={() => {
                        setShowCategoryModal(false);
                        fetchCategories();
                    }}
                />
            )}

            {/* Modal */}
            {showProductModal && (
                <ProductFormModal
                    categories={categories}
                    initialData={editingProduct}
                    onClose={() => setShowProductModal(false)}
                    onSuccess={() => { setShowProductModal(false); fetchProducts(); }}
                />
            )}
        </div>
    );
};

export default ProductManagePage;
