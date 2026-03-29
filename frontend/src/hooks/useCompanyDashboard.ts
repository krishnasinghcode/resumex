import { useState, useEffect, useCallback } from 'react';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';

export const useCompanyDashboard = () => {
  const [refIDs,  setRefIDs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await companyApi.getDashboard();
      setRefIDs(data.data.refIDs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  return { refIDs, loading, error, refetch: fetchDashboard };
};
