import React, { useCallback } from 'react';

/**
 * Price Range Slider Component
 * Provides two overlapping range sliders with a colored highlight track,
 * non-crossing thumbs, and live currency formatting.
 */
export default function PriceRangeSlider({
  min = 199,
  max = 49999,
  minPrice = 199,
  maxPrice = 49999,
  onChange
}) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);

  // Calculate percentage positions for the active colored track
  const minPercent = safeMax > safeMin
    ? Math.min(100, Math.max(0, Math.round(((minPrice - safeMin) / (safeMax - safeMin)) * 100)))
    : 0;
  const maxPercent = safeMax > safeMin
    ? Math.min(100, Math.max(0, Math.round(((maxPrice - safeMin) / (safeMax - safeMin)) * 100)))
    : 100;

  const handleMinChange = useCallback(
    (e) => {
      const value = Math.min(Number(e.target.value), maxPrice);
      onChange(value, maxPrice);
    },
    [maxPrice, onChange]
  );

  const handleMaxChange = useCallback(
    (e) => {
      const value = Math.max(Number(e.target.value), minPrice);
      onChange(minPrice, value);
    },
    [minPrice, onChange]
  );

  return (
    <fieldset className="filter-fieldset">
      <legend className="filter-legend">Price Range</legend>

      <div className="price-values-display">
        <span className="price-badge">₹{minPrice.toLocaleString('en-IN')}</span>
        <span className="price-separator">to</span>
        <span className="price-badge">₹{maxPrice.toLocaleString('en-IN')}</span>
      </div>

      <div className="price-slider-container">
        {/* Background base track */}
        <div className="slider-track-bg" />

        {/* Dynamic colored active track between thumbs */}
        <div
          className="slider-track-active"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`
          }}
        />

        {/* Lower boundary thumb input */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          value={minPrice}
          onChange={handleMinChange}
          aria-label="Minimum price filter"
          className="thumb-range thumb-range--left"
          style={{ zIndex: minPrice > safeMax - 100 ? '5' : '3' }}
        />

        {/* Upper boundary thumb input */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          value={maxPrice}
          onChange={handleMaxChange}
          aria-label="Maximum price filter"
          className="thumb-range thumb-range--right"
          style={{ zIndex: '4' }}
        />
      </div>

      <div className="slider-boundary-labels">
        <span>₹{safeMin.toLocaleString('en-IN')}</span>
        <span>₹{safeMax.toLocaleString('en-IN')}</span>
      </div>
    </fieldset>
  );
}
