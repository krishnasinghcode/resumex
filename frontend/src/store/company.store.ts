import { create } from 'zustand';

interface CompanyUser {
  _id:       string;
  name:      string;
  email:     string;
  slug:      string;
  website?:  string;
  industry?: string;
}

interface CompanyStore {
  accessToken:     string | null;
  company:         CompanyUser | null;
  isAuthenticated: boolean;
  setAuth:         (token: string, company: CompanyUser) => void;
  clearAuth:       () => void;
  setToken:        (token: string) => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  accessToken:     null,
  company:         null,
  isAuthenticated: false,

  setAuth: (token, company) => set({ accessToken: token, company, isAuthenticated: true }),
  clearAuth: ()              => set({ accessToken: null, company: null, isAuthenticated: false }),
  setToken: (token)          => set({ accessToken: token }),
}));
