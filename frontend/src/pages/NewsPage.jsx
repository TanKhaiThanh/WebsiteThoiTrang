import React from 'react';
import { motion } from 'framer-motion';

const MOCK_NEWS = [
    {
        id: 1,
        title: "BỘ SƯU TẬP MÙA THU 2026: DẤU ẤN THANH LỊCH",
        description: "Khám phá nét lãng mạn và tinh tế của mùa thu qua những bộ trang phục mới nhất đến từ ASMAW. Đề cao sự tối giản nhưng không kém phần sang trọng.",
        date: "15/08/2026",
        image: "/news_autumn.png",
        category: "Fashion"
    },
    {
        id: 2,
        title: "XU HƯỚNG MÀU SẮC CHỦ ĐẠO NĂM NAY",
        description: "Năm 2026 đánh dấu sự trở lại của các gam màu trung tính kết hợp cùng những tông nhạt pastel. Cùng chuyên gia phong cách phân tích xu hướng.",
        date: "02/08/2026",
        image: "/news_trend.png",
        category: "Trend"
    },
    {
        id: 3,
        title: "SỰ KIỆN RA MẮT FLAGSHIP STORE TẠI QUẬN 1",
        description: "ASMAW chính thức khai trương chi nhánh lớn nhất tại trung tâm TP.HCM với vô vàn những ưu đãi bất ngờ dành cho 100 khách hàng đầu tiên.",
        date: "28/07/2026",
        image: "/news_store.png",
        category: "Event"
    },
    {
        id: 4,
        title: "BÍ QUYẾT BẢO QUẢN ÁO LEN LÔNG CỪU",
        description: "Áo len là một item không thể thiếu, nhưng giặt ủi đúng cách ra sao để form dáng luôn như mới? Bài viết cung cấp tips hữu ích nhất.",
        date: "10/07/2026",
        image: "/news_tips.png",
        category: "Tips"
    }
];

const NewsPage = () => {
    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Vùng Tiêu Đề Bài Báo (Hero Header) */}
            <div style={{ backgroundColor: '#f9fafb', padding: '6rem 2rem 4rem 2rem', textAlign: 'center' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 'normal', color: '#111', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '4px' }}
                >
                    Tin Tức ASMAW
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: '#666', maxWidth: '600px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}
                >
                    Cập nhật xu hướng thời trang quốc tế, sự kiện nổi bật và bộ sưu tập độc quyền dành riêng cho giới mộ điệu.
                </motion.p>
            </div>

            {/* Danh sách Tin (Grid) */}
            <div className="container" style={{ marginTop: '4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '3rem' }}>
                    {MOCK_NEWS.map((item, index) => (
                        <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            {/* Khung chứa ảnh tràn */}
                            <div style={{ overflow: 'hidden', backgroundColor: '#f3f4f6', aspectRatio: '4/3' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                />
                            </div>

                            {/* Thông tin Meta & Tiêu đề */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                                        {item.category}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.date}</span>
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', lineHeight: '1.4', color: '#111', marginBottom: '1rem' }}>
                                    {item.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.6', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.description}
                                </p>
                                <button style={{ background: 'none', border: 'none', padding: 0, color: '#111', borderBottom: '1px solid #111', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Đọc Tiếp
                                </button>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsPage;
