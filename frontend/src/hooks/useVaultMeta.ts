import { useState, useEffect, useCallback } from 'react';
import { vaultApi } from '@/api/vault.api';
import { getErrorMessage } from '@/api/axios';
import type { VaultMeta } from '@/types/vault.types';

export const useVaultMeta = () => {
  const [meta, setMeta]       = useState<VaultMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchMeta = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await vaultApi.getMeta();
      setMeta(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchMeta(); }, [fetchMeta]);

  return { meta, loading, error, refetch: fetchMeta };
};
