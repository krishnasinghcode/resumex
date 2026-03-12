import { useState, useEffect } from 'react';
import { referenceApi, type ReferenceItem } from '@/api/reference.api';

// Module-level cache — persists for the tab session
// Reference data never changes mid-session so this is fine
const cache: Record<string, ReferenceItem[]> = {};

export const useReferenceData = (type: string) => {
  const [items,   setItems]   = useState<ReferenceItem[]>(cache[type] ?? []);
  const [loading, setLoading] = useState(!cache[type]);

  useEffect(() => {
    if (cache[type]) return;

    let cancelled = false;
    setLoading(true);

    referenceApi.getByType(type)
      .then(data => {
        if (!cancelled) {
          cache[type] = data;
          setItems(data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [type]);

  // Just the label strings — for simple combobox options
  const labels = items.map(i => i.label);

  return { items, labels, loading };
};