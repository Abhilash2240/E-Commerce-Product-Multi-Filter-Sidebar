import React from 'react';
import useProducts from './hooks/useProducts.js';
import FilterSidebar from './components/FilterSidebar.jsx';
import './App.css';

export default function App() {
  const {
    meta,
    isMetaLoading,
    filters,
    products,
    count,
    total,
    isLoading,
    error,
    toggleCategory,
    setPriceRange,
    setMinRating,
    setSort,
    resetFilters
  } = useProducts();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="brand-title">
            Quantiphi E-Commerce
            <span className="brand-badge">Catalog</span>
          </h1>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="catalog-layout">
          {/* Sidebar with filters: Category, Price, Rating, Clear all */}
          <FilterSidebar
            meta={meta}
            filters={filters}
            onToggleCategory={toggleCategory}
            onPriceChange={setPriceRange}
            onRatingChange={setMinRating}
            onReset={resetFilters}
          />

          {/* Product Results */}
          <section className="products-content" aria-label="Product Search Results">
            <div className="catalog-toolbar">
              <div className="results-count">
                {isLoading ? (
                  <span className="loading-indicator">
                    <span className="spinner" />
                    Updating catalog...
                  </span>
                ) : (
                  <span>
                    Showing <strong>{count}</strong> of <strong>{total}</strong> products
                  </span>
                )}
              </div>

              {meta?.sortOptions && (
                <div className="sort-selector-wrapper">
                  <label htmlFor="catalog-sort" className="sort-label">
                    Sort by:
                  </label>
                  <select
                    id="catalog-sort"
                    value={filters.sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="sort-select"
                  >
                    {meta.sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="products-grid">
                {products.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="product-image"
                      />
                    </div>
                    <div className="product-card-body">
                      <span className="product-category-tag">{product.category}</span>
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-card-footer">
                        <span className="product-price">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="product-rating" aria-label={`Rating: ${product.rating} stars`}>
                          <span className="product-rating-star">★</span>
                          <span>{product.rating.toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="empty-state">
                  <h3 className="empty-state-title">No products found</h3>
                  <p className="empty-state-text">
                    Try adjusting your category, price range, or rating filters to find what you are looking for.
                  </p>
                  <button type="button" onClick={resetFilters} className="btn-clear-filters">
                    Reset all filters
                  </button>
                </div>
              )
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
