import React from 'react';

/**
 * Category Filter Component
 * Renders category checkboxes sourced from backend metadata.
 */
export default function CategoryFilter({
  categories = [],
  selectedCategories = [],
  onToggleCategory
}) {
  return (
    <fieldset className="filter-fieldset">
      <legend className="filter-legend">Category</legend>
      <div className="filter-options-group">
        {categories.map((category) => {
          const id = `category-filter-${category.toLowerCase().replace(/\s+/g, '-')}`;
          const isChecked = selectedCategories.includes(category);

          return (
            <label key={category} htmlFor={id} className="filter-checkbox-label">
              <input
                type="checkbox"
                id={id}
                name="category"
                value={category}
                checked={isChecked}
                onChange={() => onToggleCategory(category)}
                className="filter-checkbox"
              />
              <span className="filter-label-text">{category}</span>
            </label>
          );
        })}
      </div>
      {selectedCategories.length === 0 && (
        <span className="filter-helper-text">Showing all categories</span>
      )}
    </fieldset>
  );
}
