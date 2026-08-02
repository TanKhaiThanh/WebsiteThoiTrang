import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, setPage }) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            pages.push(i);
        } else if (i === page - 2 || i === page + 2) {
            pages.push('...');
        }
    }
    const safePages = pages.filter((p, idx, arr) => arr.indexOf(p) === idx);

    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.25rem 1rem', borderTop: '1px solid var(--color-border)', gap: '0.5rem', alignItems: 'center' }}>
            <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{
                    display: 'flex', alignItems: 'center', padding: '0.5rem',
                    border: '1px solid var(--color-border)', borderRadius: '6px',
                    background: 'var(--color-surface)', color: page <= 1 ? '#ccc' : 'var(--color-text)',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                }}
            >
                <ChevronLeft size={16} />
            </button>

            {safePages.map((p, idx) => (
                <button
                    key={idx}
                    disabled={p === '...'}
                    onClick={() => p !== '...' && setPage(p)}
                    style={{
                        minWidth: '32px', height: '32px', padding: '0 0.5rem',
                        border: p === '...' ? 'none' : (p === page ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'),
                        background: p === page ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: p === page ? 'white' : 'var(--color-text)',
                        borderRadius: '6px', fontWeight: p === page ? 600 : 400,
                        cursor: p === '...' ? 'default' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {p}
                </button>
            ))}

            <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                    display: 'flex', alignItems: 'center', padding: '0.5rem',
                    border: '1px solid var(--color-border)', borderRadius: '6px',
                    background: 'var(--color-surface)', color: page >= totalPages ? '#ccc' : 'var(--color-text)',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
