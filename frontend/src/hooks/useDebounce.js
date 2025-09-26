import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup function to clear timeout on unmount
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedCallback, cancel };
};

/**
 * Custom hook for debouncing with loading state and preventing multiple calls
 * Ideal for form submissions and API calls
 * @param {Function} callback - The async function to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 300ms)
 * @returns {Object} - { execute, loading, cancel }
 */
export const useSubmitDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);
  const loadingRef = useRef(false);

  const execute = useCallback(async (...args) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        loadingRef.current = true;
        await callback(...args);
      } catch (error) {
        console.error('Debounced callback error:', error);
      } finally {
        loadingRef.current = false;
      }
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    loadingRef.current = false;
  }, []);

  const isLoading = useCallback(() => loadingRef.current, []);

  return { execute, isLoading, cancel };
};

export default useDebounce;