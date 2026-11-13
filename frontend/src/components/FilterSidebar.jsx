import React from 'react';
import CategoryFilter from './CategoryFilter.jsx';
import PriceRangeSlider from './PriceRangeSlider.jsx';
import RatingFilter from './RatingFilter.jsx';

/**
 * FilterSidebar Component
 * Orchestrates category, price range, and rating filters in specified hierarchical order:
 * 1. Category first
 * 2. Price second
 * 3. Rating third
 * 4. Clear all button
 */
export default function FilterSidebar({
  meta,
  filters,
  onToggleCategory,
  onPriceChange,
  onRatingChange,
  onReset
}) {
  const categories = meta?.categories || [];
  const minBoundary = meta?.minPrice ?? 199;
  const maxBoundary = meta?.maxPrice ?? 49999;

  return (
    <aside className="filter-sidebar" aria-label="Product Catalog Filters">
      <div className="filter-sidebar-header">
        <h2 className="filter-sidebar-title">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="btn-clear-filters"
          aria-label="Clear all applied filters"
        >
          Clear All
        </button>
      </div>

      <div className="filter-sidebar-content">
        {/* 1. Category First */}
        <CategoryFilter
          categories={categories}
          selectedCategories={filters.categories}
          onToggleCategory={onToggleCategory}
        />

        {/* 2. Price Second */}
        <PriceRangeSlider
          min={minBoundary}
          max={maxBoundary}
          minPrice={filters.minPrice ?? minBoundary}
          maxPrice={filters.maxPrice ?? maxBoundary}
          onChange={onPriceChange}
        />

        {/* 3. Rating Third */}
        <RatingFilter
          selectedRating={filters.minRating}
          onChange={onRatingChange}
        />
      </div>
    </aside>
  );
}
