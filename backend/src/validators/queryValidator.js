import { CATEGORIES, SORT_OPTIONS } from '../utils/constants.js';

export class QueryValidationError extends Error {
  constructor(message = 'Invalid query parameters') {
    super(message);
    this.name = 'QueryValidationError';
    this.statusCode = 400;
  }
}

const SUPPORTED_SORTS = new Set([
  SORT_OPTIONS.RELEVANCE,
  SORT_OPTIONS.PRICE_ASC,
  SORT_OPTIONS.PRICE_DESC,
  SORT_OPTIONS.RATING_DESC
]);

/**
 * Validates, parses, and sanitizes query parameters for product exploration.
 * 
 * @param {Record<string, unknown>} rawQuery - The query parameters object from req.query
 * @param {{ minPrice: number, maxPrice: number }} datasetBoundaries - Dynamic min & max price from dataset
 * @returns {{ categories: string[], minPrice: number, maxPrice: number, minRating: number | null, sort: string }}
 * @throws {QueryValidationError} When array- or object-valued query parameters are present
 */
export function validateQueryParams(rawQuery = {}, datasetBoundaries = { minPrice: 199, maxPrice: 49999 }) {
  if (rawQuery === null || typeof rawQuery !== 'object') {
    rawQuery = {};
  }

  // 1. Error Handling: Array/object-valued query parameters return HTTP 400
  for (const [key, value] of Object.entries(rawQuery)) {
    if (value !== null && typeof value === 'object') {
      throw new QueryValidationError(
        `Invalid query parameter '${key}': Array- or object-valued parameters are not allowed.`
      );
    }
  }

  // 2. CATEGORIES Sanitization
  // Accept comma-separated values, trim whitespace, keep only known categories.
  // Empty selection means all categories.
  let categories = [...CATEGORIES];
  if (typeof rawQuery.categories === 'string' && rawQuery.categories.trim() !== '') {
    const requested = rawQuery.categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const validCategories = [];
    for (const item of requested) {
      const match = CATEGORIES.find(
        (known) => known.toLowerCase() === item.toLowerCase()
      );
      if (match && !validCategories.includes(match)) {
        validCategories.push(match);
      }
    }

    if (validCategories.length > 0) {
      categories = validCategories;
    }
  }

  // 3. PRICE Sanitization
  // Convert values to Number.
  // Invalid numbers use dataset boundaries.
  // Clamp values to dataset boundaries.
  // If minPrice > maxPrice, swap them.
  // Support inclusive price boundaries.
  const boundMin = typeof datasetBoundaries.minPrice === 'number' ? datasetBoundaries.minPrice : 199;
  const boundMax = typeof datasetBoundaries.maxPrice === 'number' ? datasetBoundaries.maxPrice : 49999;

  let minPrice = boundMin;
  if (rawQuery.minPrice !== undefined && rawQuery.minPrice !== null && String(rawQuery.minPrice).trim() !== '') {
    const parsedMin = Number(rawQuery.minPrice);
    if (!Number.isFinite(parsedMin)) {
      minPrice = boundMin;
    } else {
      minPrice = Math.max(boundMin, Math.min(parsedMin, boundMax));
    }
  }

  let maxPrice = boundMax;
  if (rawQuery.maxPrice !== undefined && rawQuery.maxPrice !== null && String(rawQuery.maxPrice).trim() !== '') {
    const parsedMax = Number(rawQuery.maxPrice);
    if (!Number.isFinite(parsedMax)) {
      maxPrice = boundMax;
    } else {
      maxPrice = Math.max(boundMin, Math.min(parsedMax, boundMax));
    }
  }

  // If minPrice > maxPrice, swap them
  if (minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }

  // Ensure prices are integers for whole-number pricing
  minPrice = Math.round(minPrice);
  maxPrice = Math.round(maxPrice);

  // 4. RATING Sanitization
  // Accept integer values from 1 to 5.
  // Invalid values become null. Null means no rating filter.
  let minRating = null;
  if (rawQuery.minRating !== undefined && rawQuery.minRating !== null && String(rawQuery.minRating).trim() !== '') {
    const parsedRating = Number(rawQuery.minRating);
    if (Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      minRating = parsedRating;
    } else {
      minRating = null;
    }
  }

  // 5. SORT Sanitization
  // Supported: relevance, price_asc, price_desc, rating_desc
  // Unknown sort values default to relevance.
  let sort = SORT_OPTIONS.RELEVANCE;
  if (typeof rawQuery.sort === 'string' && rawQuery.sort.trim() !== '') {
    const normalizedSort = rawQuery.sort.trim().toLowerCase();
    if (SUPPORTED_SORTS.has(normalizedSort)) {
      sort = normalizedSort;
    }
  }

  return {
    categories,
    minPrice,
    maxPrice,
    minRating,
    sort
  };
}

/**
 * Express middleware to validate and sanitize query parameters on req.query.
 * Attaches sanitized query object to req.validatedQuery.
 */
export function validateProductsQuery(req, res, next) {
  try {
    const datasetBoundaries = req.app.get('priceBoundaries') || { minPrice: 199, maxPrice: 49999 };
    req.validatedQuery = validateQueryParams(req.query, datasetBoundaries);
    next();
  } catch (err) {
    next(err);
  }
}

