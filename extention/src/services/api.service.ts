import { getAccessToken } from '../utils/storage';

const API_BASE = 'http://localhost:5000/api';

export interface FormField {
  id: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

export interface FieldMatch {
  fieldId: string;
  fieldName: string;
  matchedKey: string;
  matchedValue: any;
  confidence: number;
  section: string;
}

export interface SearchResult {
  section: string;
  fieldName: string;
  value: any;
  path: string;
}

class ApiService {
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data; // Extract data from { success, message, data }
  }

  async matchFields(fields: FormField[]): Promise<FieldMatch[]> {
    return this.fetch('/extension/match-fields', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
  }

  async getAutofillData(): Promise<Record<string, any>> {
    return this.fetch('/extension/autofill-data');
  }

  async searchVault(query: string): Promise<SearchResult[]> {
    return this.fetch(`/extension/search?q=${encodeURIComponent(query)}`);
  }
}

export const apiService = new ApiService();