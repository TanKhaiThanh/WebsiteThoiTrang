import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy' }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)', width: '100%', maxWidth: '400px',
                borderRadius: '12px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-error)' }}>
                    <AlertCircle size={24} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)' }}>{title}</h3>
                </div>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                            backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.25rem' }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ConfirmModal;
