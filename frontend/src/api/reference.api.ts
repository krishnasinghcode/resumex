import api from './axios';

export interface ReferenceItem {
  _id:    string;
  value:  string;
  label:  string;
  meta?:  Record<string, unknown>;
}

export const referenceApi = {
  getByType: async (type: string): Promise<ReferenceItem[]> => {
    const { data } = await api.get(`/api/reference?type=${type}`);
    return data.data;
  },
};