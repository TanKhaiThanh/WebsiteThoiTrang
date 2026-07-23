import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const PriceRangeSlider = ({ min, max, value, onChange, onChangeComplete }) => {
    return (
        <div style={{ padding: '0 10px', marginTop: '1rem', width: '100%' }}>
            <Slider
                range
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                onChangeComplete={onChangeComplete}
                allowCross={false}
                trackStyle={[{ backgroundColor: '#111', height: 4 }]}
                handleStyle={[
                    {
                        backgroundColor: '#111',
                        borderColor: '#111',
                        opacity: 1,
                        width: 18,
                        height: 18,
                        marginTop: -7,
                        boxShadow: 'none',
                        outline: 'none',
                        cursor: 'grab'
                    },
                    {
                        backgroundColor: '#111',
                        borderColor: '#111',
                        opacity: 1,
                        width: 18,
                        height: 18,
                        marginTop: -7,
                        boxShadow: 'none',
                        outline: 'none',
                        cursor: 'grab'
                    }
                ]}
                railStyle={{ backgroundColor: '#eaeaea', height: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value[0])}</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value[1])}</span>
            </div>
        </div>
    );
};

export default PriceRangeSlider;
