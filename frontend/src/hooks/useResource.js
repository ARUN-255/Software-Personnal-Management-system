import { useCallback, useEffect, useRef, useState } from 'react';

// Ignore stale responses when a user navigates or changes a filter quickly.
export function useResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      if (request === sequence.current) setData(result);
    } catch (error) {
      if (request === sequence.current) setError(error.message);
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, dependencies);
  useEffect(() => {
    reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  return {
    data,
    error,
    loading,
    reload
  };
}
