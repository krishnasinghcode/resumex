import api from './axios';
import type { VaultMeta, VaultSection, SectionKey } from '@/types/vault.types';
import type { ApiResponse } from '@/types/api.types';

export const vaultApi = {

  getMeta: async (): Promise<VaultMeta> => {
    const { data } = await api.get<ApiResponse<VaultMeta>>('/api/vault/meta');
    return data.data!;
  },

  getSection: async (sectionKey: SectionKey): Promise<VaultSection> => {
    const { data } = await api.get<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}`);
    return data.data!;
  },

  addEntry: async (sectionKey: SectionKey, entry: Record<string, unknown>): Promise<VaultSection> => {
    const { data } = await api.post<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}/entry`, entry);
    return data.data!;
  },

  updateEntry: async (sectionKey: SectionKey, entryId: string, updates: Record<string, unknown>): Promise<VaultSection> => {
    const { data } = await api.patch<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}/entry/${entryId}`, updates);
    return data.data!;
  },

  deleteEntry: async (sectionKey: SectionKey, entryId: string): Promise<VaultSection> => {
    const { data } = await api.delete<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}/entry/${entryId}`);
    return data.data!;
  },

  toggleSectionPrivacy: async (sectionKey: SectionKey, isPrivate: boolean): Promise<VaultSection> => {
    const { data } = await api.patch<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}/privacy`, { isPrivate });
    return data.data!;
  },

  toggleEntryPrivacy: async (sectionKey: SectionKey, entryId: string, isPrivate: boolean): Promise<VaultSection> => {
    const { data } = await api.patch<ApiResponse<VaultSection>>(`/api/vault/section/${sectionKey}/entry/${entryId}/privacy`, { isPrivate });
    return data.data!;
  },

  exportVault: async (): Promise<unknown> => {
    const { data } = await api.get<ApiResponse<unknown>>('/api/vault/export');
    return data.data!;
  },
};
