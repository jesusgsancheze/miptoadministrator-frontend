import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

/** Minimal read hook for list pages. Extend with create/update as needed. */
export function useResource<T = any>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    api.get(endpoint)
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}
