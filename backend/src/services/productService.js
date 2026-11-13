import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SORT_OPTIONS, SORT_OPTIONS_LIST } from '../utils/constants.js';
import { validateQueryParams } from '../validators/queryValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.resolve(__dirname, '../data/products.json');

// Synchronously load products dataset as an immutable base reference
const rawProducts = fs.readFileSync(dataFilePath, 'utf-8');
export const products = Object.freeze(JSON.parse(rawProducts));

// Calculates dataset metadata including dynamic price boundaries, categories, and sort options.
export function getMeta(items = products) {
  const categories = [...new Set(items.map((p) => p.category))];
  const prices = items.map((p) => p.price);
  return {
    categories,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    sortOptions: SORT_OPTIONS_LIST
  };
}

// Determines if any filter criteria deviates from the full inventory defaults.
export function hasActiveFilters(filters = {}, meta = getMeta()) {
  const isCategoryActive = Array.isArray(filters.categories) &&
    filters.categories.length > 0 &&
    filters.categories.length < meta.categories.length;
  const isMinPriceActive = typeof filters.minPrice === 'number' && filters.minPrice > meta.minPrice;
  const isMaxPriceActive = typeof filters.maxPrice === 'number' && filters.maxPrice < meta.maxPrice;
  const isRatingActive = typeof filters.minRating === 'number' && filters.minRating !== null;

  return Boolean(isCategoryActive || isMinPriceActive || isMaxPriceActive || isRatingActive);
}

// Filters products using combinatorial AND logic across categories, price range, and minimum rating.
export function filterProducts(items = products, filters = {}, meta = getMeta()) {
  if (!hasActiveFilters(filters, meta)) {
    return items.slice();
  }
  const { categories, minPrice, maxPrice, minRating } = filters;
  const categorySet = Array.isArray(categories) && categories.length > 0 ? new Set(categories) : null;
  const hasMinPrice = typeof minPrice === 'number' && minPrice > meta.minPrice;
  const hasMaxPrice = typeof maxPrice === 'number' && maxPrice < meta.maxPrice;

  return items.filter((item) => {
    if (categorySet && !categorySet.has(item.category)) return false;
    if (hasMinPrice && item.price < minPrice) return false;
    if (hasMaxPrice && item.price > maxPrice) return false;
    if (typeof minRating === 'number' && minRating !== null && item.rating < minRating) return false;
    return true;
  });
}

// Sorts product items based on requested criteria with tie-breaking rules.
export function sortProducts(items = [], sortKey = SORT_OPTIONS.RELEVANCE) {
  const copy = [...items];
  switch (sortKey) {
    case SORT_OPTIONS.PRICE_ASC:
      return copy.sort((a, b) => a.price - b.price || b.rating - a.rating || a.id - b.id);
    case SORT_OPTIONS.PRICE_DESC:
      return copy.sort((a, b) => b.price - a.price || b.rating - a.rating || a.id - b.id);
    case SORT_OPTIONS.RATING_DESC:
      return copy.sort((a, b) => b.rating - a.rating || a.price - b.price || a.id - b.id);
    case SORT_OPTIONS.RELEVANCE:
    default:
      return copy.sort((a, b) => a.id - b.id);
  }
}

// Executes the full pipeline: validates raw query, filters dataset, and sorts the results.
export function getProducts(rawQuery = {}) {
  const meta = getMeta();
  const validated = validateQueryParams(rawQuery, meta);
  const filtered = filterProducts(products, validated, meta);
  const sorted = sortProducts(filtered, validated.sort);
  return {
    count: sorted.length,
    total: products.length,
    products: sorted
  };
}

// Backwards-compatible accessor for unfiltered products inventory.
export function getAllProducts() {
  return products;
}

// Backwards-compatible accessor for dynamic price boundaries.
export function getProductPriceBoundaries() {
  const meta = getMeta();
  return { minPrice: meta.minPrice, maxPrice: meta.maxPrice };
}
