/**
 * Product API service using Native Fetch API
 * Communicates with backend endpoints through the Vite proxy (/api)
 */

const BASE_URL = '/api/products';

/**
 * Fetches dynamic product catalog metadata including categories, min/max price, and sort options.
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<{ categories: string[], minPrice: number, maxPrice: number, sortOptions: Array<{ value: string, label: string }> }>}
 */
export async function fetchMeta(signal) {
  const response = await fetch(`${BASE_URL}/meta`, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Failed to fetch metadata (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetches filtered and sorted products based on provided filter criteria.
 * @param {Object} filters
 * @param {string[]} [filters.categories]
 * @param {number} [filters.minPrice]
 * @param {number} [filters.maxPrice]
 * @param {number|null} [filters.minRating]
 * @param {string} [filters.sort]
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<{ count: number, total: number, products: Array }>}
 */
export async function fetchProducts(filters = {}, signal) {
  const params = new URLSearchParams();

  if (Array.isArray(filters.categories) && filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }

  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    params.set('minPrice', String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    params.set('maxPrice', String(filters.maxPrice));
  }

  if (filters.minRating !== undefined && filters.minRating !== null) {
    params.set('minRating', String(filters.minRating));
  }

  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  const queryString = params.toString();
  const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Failed to fetch products (HTTP ${response.status})`);
  }

  return response.json();
}
