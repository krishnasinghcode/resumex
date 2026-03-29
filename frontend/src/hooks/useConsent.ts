import { useState } from 'react';
import { refidApi } from '@/api/refid.api';
import { getErrorMessage } from '@/api/axios';

export const useConsent = () => {
  const [refIDData, setRefIDData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  const lookupRefID = async (code: string) => {
    setLoading(true); setError(null);
    try {
      const { data } = await refidApi.getByCode(code);
      setRefIDData(data.data.refID);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const grant = async (code: string) => {
    setGranting(true); setError(null);
    try {
      await refidApi.grantAccess(code);
      setGranted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGranting(false);
    }
  };

  return { refIDData, loading, granting, error, granted, lookupRefID, grant };
};