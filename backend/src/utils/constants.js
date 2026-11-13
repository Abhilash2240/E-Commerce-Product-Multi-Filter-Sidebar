/**
 * Supported product categories in the catalog
 */
export const CATEGORIES = Object.freeze([
  'Electronics',
  'Apparel',
  'Footwear'
]);

/**
 * Supported sorting options for products
 */
export const SORT_OPTIONS = Object.freeze({
  RELEVANCE: 'relevance',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  RATING_DESC: 'rating_desc'
});

/**
 * Sort options presentation metadata
 */
export const SORT_OPTIONS_LIST = Object.freeze([
  { value: SORT_OPTIONS.RELEVANCE, id: SORT_OPTIONS.RELEVANCE, label: 'Relevance' },
  { value: SORT_OPTIONS.PRICE_ASC, id: SORT_OPTIONS.PRICE_ASC, label: 'Price: Low to High' },
  { value: SORT_OPTIONS.PRICE_DESC, id: SORT_OPTIONS.PRICE_DESC, label: 'Price: High to Low' },
  { value: SORT_OPTIONS.RATING_DESC, id: SORT_OPTIONS.RATING_DESC, label: 'Top Rated First' }
]);

/**
 * Computes price boundaries dynamically from any product dataset.
 * Price boundaries are not hardcoded.
 * 
 * @param {Array<{ price: number }>} products
 * @returns {{ minPrice: number, maxPrice: number }}
 */
export function computePriceBoundaries(products = []) {
  if (!Array.isArray(products) || products.length === 0) {
    return { minPrice: 0, maxPrice: 0 };
  }
  const prices = products.map((item) => item.price);
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices)
  };
}

