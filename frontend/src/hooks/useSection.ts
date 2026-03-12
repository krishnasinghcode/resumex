import { useState, useEffect, useCallback } from 'react';
import { vaultApi } from '@/api/vault.api';
import { getErrorMessage } from '@/api/axios';
import type { SectionKey, VaultSection } from '@/types/vault.types';

export const useSection = (sectionKey: SectionKey) => {
  const [section, setSection] = useState<VaultSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchSection = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await vaultApi.getSection(sectionKey);
      setSection(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sectionKey]);

  useEffect(() => { void fetchSection(); }, [fetchSection]);

  const addEntry = async (entry: Record<string, unknown>): Promise<boolean> => {
    setSaving(true); setError(null);
    try {
      const updated = await vaultApi.addEntry(sectionKey, entry);
      setSection(updated);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = async (entryId: string, updates: Record<string, unknown>): Promise<boolean> => {
    setSaving(true); setError(null);
    try {
      const updated = await vaultApi.updateEntry(sectionKey, entryId, updates);
      setSection(updated);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entryId: string): Promise<boolean> => {
    setSaving(true); setError(null);
    try {
      const updated = await vaultApi.deleteEntry(sectionKey, entryId);
      setSection(updated);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionPrivacy = async (isPrivate: boolean): Promise<void> => {
    try {
      const updated = await vaultApi.toggleSectionPrivacy(sectionKey, isPrivate);
      setSection(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleEntryPrivacy = async (entryId: string, isPrivate: boolean): Promise<void> => {
    try {
      const updated = await vaultApi.toggleEntryPrivacy(sectionKey, entryId, isPrivate);
      setSection(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return {
    section, loading, saving, error,
    addEntry, updateEntry, deleteEntry,
    toggleSectionPrivacy, toggleEntryPrivacy,
    refetch: fetchSection,
  };
};
