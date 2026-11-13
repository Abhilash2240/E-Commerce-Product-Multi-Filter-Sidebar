import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMeta, fetchProducts } from '../api/productApi.js';
import { useDebounce } from './useDebounce.js';

/**
 * Custom hook to manage product catalog state, filter synchronization,
 * debounced requests, and cancellation of stale network calls.
 */
export function useProducts() {
  const [meta, setMeta] = useState(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    categories: [],
    minPrice: 0,
    maxPrice: 0,
    minRating: null,
    sort: 'relevance'
  });

  // Debounce price changes by 300ms so rapid slider interactions do not flood the server
  const debouncedMinPrice = useDebounce(filters.minPrice, 300);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 300);

  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load: Fetch server metadata to discover categories, sort options, and boundary prices
  useEffect(() => {
    const controller = new AbortController();

    async function initializeCatalogMeta() {
      try {
        setIsMetaLoading(true);
        const metaData = await fetchMeta(controller.signal);
        setMeta(metaData);
        setFilters((prev) => ({
          ...prev,
          minPrice: metaData.minPrice,
          maxPrice: metaData.maxPrice
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to initialize catalog metadata');
        }
      } finally {
        setIsMetaLoading(false);
      }
    }

    initializeCatalogMeta();

    return () => {
      controller.abort();
    };
  }, []);

  // Filter effect: Triggered whenever filters change (with debounced prices).
  // Uses AbortController to cancel pending in-flight requests and prevent race conditions.
  useEffect(() => {
    // Wait until metadata is loaded and price boundaries are ready
    if (!meta || debouncedMinPrice === undefined || debouncedMaxPrice === undefined) {
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const activeFilters = {
          categories: filters.categories,
          minPrice: debouncedMinPrice,
          maxPrice: debouncedMaxPrice,
          minRating: filters.minRating,
          sort: filters.sort
        };

        const result = await fetchProducts(activeFilters, controller.signal);
        setProducts(result.products || []);
        setCount(result.count ?? (result.products ? result.products.length : 0));
        setTotal(result.total ?? 30);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load products');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    meta,
    filters.categories,
    debouncedMinPrice,
    debouncedMaxPrice,
    filters.minRating,
    filters.sort
  ]);

  // Handler to toggle a category checkbox
  const toggleCategory = useCallback((category) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(category);
      const nextCategories = exists
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: nextCategories };
    });
  }, []);

  // Handler for price slider changes
  const setPriceRange = useCallback((minPrice, maxPrice) => {
    setFilters((prev) => ({
      ...prev,
      minPrice,
      maxPrice
    }));
  }, []);

  // Handler for rating selection
  const setMinRating = useCallback((minRating) => {
    setFilters((prev) => ({
      ...prev,
      minRating
    }));
  }, []);

  // Handler for sort selection
  const setSort = useCallback((sort) => {
    setFilters((prev) => ({
      ...prev,
      sort
    }));
  }, []);

  // Reset all filters restoring defaults from metadata
  const resetFilters = useCallback(() => {
    if (!meta) return;
    setFilters({
      categories: [],
      minPrice: meta.minPrice,
      maxPrice: meta.maxPrice,
      minRating: null,
      sort: 'relevance'
    });
  }, [meta]);

  return {
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
  };
}

export default useProducts;
