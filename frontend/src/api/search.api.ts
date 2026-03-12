import api from './axios';
import type { SearchResult } from '@/types/vault.types';
import type { ApiResponse } from '@/types/api.types';

export const searchApi = {
  search: async (query: string, includePrivate = true): Promise<SearchResult> => {
    const { data } = await api.get<ApiResponse<SearchResult>>('/api/vault/search', {
      params: { q: query, includePrivate },
    });
    return data.data!;
  },
};
