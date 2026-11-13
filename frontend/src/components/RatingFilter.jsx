import React from 'react';

const RATING_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1★ & up', value: 1 },
  { label: '2★ & up', value: 2 },
  { label: '3★ & up', value: 3 },
  { label: '4★ & up', value: 4 },
  { label: '5★ & up', value: 5 }
];

/**
 * Rating Filter Component
 * Renders radio buttons for minimum rating thresholds.
 * 'Any' is the default and yields null.
 */
export default function RatingFilter({ selectedRating = null, onChange }) {
  return (
    <fieldset className="filter-fieldset">
      <legend className="filter-legend">Customer Rating</legend>
      <div className="filter-options-group">
        {RATING_OPTIONS.map((option) => {
          const id = `rating-option-${option.value === null ? 'any' : option.value}`;
          const isChecked = selectedRating === option.value;

          return (
            <label key={id} htmlFor={id} className="filter-radio-label">
              <input
                type="radio"
                id={id}
                name="minRating"
                value={option.value === null ? '' : option.value}
                checked={isChecked}
                onChange={() => onChange(option.value)}
                className="filter-radio"
              />
              <span className="filter-label-text">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
