import { useEffect, useState } from 'react';
import { api, messageOf } from '../services/api';
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(!!path), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => { const c = new AbortController(); setData(null); setError(''); setLoading(!!path); if (path) void api<T>(path, 'GET', undefined, c.signal).then(setData).catch(e => { if (!c.signal.aborted) setError(messageOf(e)); }).finally(() => { if (!c.signal.aborted) setLoading(false); }); return () => c.abort(); }, [path, revision]);
  return { data, setData, loading, error, reload: () => setRevision(n => n + 1) };
}
