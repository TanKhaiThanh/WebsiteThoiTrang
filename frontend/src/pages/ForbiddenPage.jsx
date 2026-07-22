import React from 'react';
import { Link } from 'react-router-dom';

const ForbiddenPage = () => {
    return (
        <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', color: 'var(--color-error)', margin: 0 }}>403</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Không Có Quyền Truy Cập</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                Xin lỗi, bạn không có quyền truy cập vào trang này.
                Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn.
            </p>
            <Link to="/" className="btn btn-primary">
                Về Trang Chủ
            </Link>
        </div>
    );
};

export default ForbiddenPage;
