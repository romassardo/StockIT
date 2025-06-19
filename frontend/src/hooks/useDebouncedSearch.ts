import { useEffect, useState } from 'react';

/**
 * Hook genérico para debounce de valores. Devuelve el valor después de que
 * haya transcurrido el delay sin cambios.
 * 
 * use context7
 */
export function useDebouncedSearch<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
