import React from 'react';
import { Check } from 'lucide-react';

const CustomCheckbox = ({ id, label, checked, onChange }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => onChange(!checked)}>
            <div 
                style={{ 
                    width: '20px', 
                    height: '20px', 
                    border: checked ? '2px solid var(--color-primary)' : '2px solid var(--color-border)', 
                    backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    borderRadius: '2px'
                }}
            >
                {checked && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
            {label && (
                <label 
                    htmlFor={id} 
                    style={{ 
                        margin: 0, 
                        cursor: 'pointer', 
                        color: checked ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: checked ? 500 : 400,
                        transition: 'color 0.2s ease'
                    }}
                    onClick={(e) => { e.preventDefault(); }}
                >
                    {label}
                </label>
            )}
        </div>
    );
};

export default CustomCheckbox;
