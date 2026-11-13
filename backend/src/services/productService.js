import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SORT_OPTIONS_LIST } from '../utils/constants.js';

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

// Backwards-compatible accessor for unfiltered products inventory.
export function getAllProducts() {
  return products;
}

// Backwards-compatible accessor for dynamic price boundaries.
export function getProductPriceBoundaries() {
  const meta = getMeta();
  return { minPrice: meta.minPrice, maxPrice: meta.maxPrice };
}
