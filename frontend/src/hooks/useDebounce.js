import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value by a specified delay in milliseconds.
 * 
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} [delay=300] - Debounce delay in milliseconds
 * @returns {T} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
