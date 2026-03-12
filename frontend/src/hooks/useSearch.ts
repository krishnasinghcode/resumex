import { useState, useEffect, useRef } from 'react';
import { searchApi } from '@/api/search.api';
import { getErrorMessage } from '@/api/axios';
import type { SearchResult } from '@/types/vault.types';

export const useSearch = () => {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [includePrivate, setIncludePrivate] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    // Debounce: wait 400ms after last keystroke before hitting the API
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const data = await searchApi.search(query.trim(), includePrivate);
        setResults(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, includePrivate]);

  return { query, setQuery, results, loading, error, includePrivate, setIncludePrivate };
};
