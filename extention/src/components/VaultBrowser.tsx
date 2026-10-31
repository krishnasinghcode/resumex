import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiService, SearchResult } from '../services/api.service';
import { cn } from '../lib/utils';

interface VaultSection {
  title: string;
  items: { label: string; value: any }[];
}

export function VaultBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [recentCopies, setRecentCopies] = useState<{ label: string; value: any; time: number }[]>([]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await apiService.searchVault(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopy = async (value: any, label: string, path: string) => {
    try {
      const textValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await navigator.clipboard.writeText(textValue);

      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);

      // Add to recent copies
      setRecentCopies(prev => [
        { label, value: textValue, time: Date.now() },
        ...prev.slice(0, 4), // Keep last 5
      ]);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search your vault..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recent Copies */}
      {recentCopies.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase">Recently Copied</h3>
          {recentCopies.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
            >
              <div className="flex-1 truncate">
                <span className="font-medium text-gray-700">{item.label}:</span>{' '}
                <span className="text-gray-600">{item.value}</span>
              </div>
              <span className="text-xs text-gray-400 ml-2">
                {Math.round((Date.now() - item.time) / 1000)}s ago
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase">
            {searching ? 'Searching...' : `${searchResults.length} Result${searchResults.length !== 1 ? 's' : ''}`}
          </h3>

          {searchResults.length === 0 && !searching && (
            <p className="text-sm text-gray-500 text-center py-4">No results found</p>
          )}

          {searchResults.map((result, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white border rounded hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">{result.section}</div>
                <div className="text-sm font-medium truncate">{result.fieldName}</div>
                <div className="text-sm text-gray-600 truncate">{formatValue(result.value)}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(result.value, result.fieldName, result.path)}
                className="ml-2 shrink-0"
              >
                {copiedPath === result.path ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Static Vault Browser (when not searching) */}
      {!searchQuery && <StaticVaultBrowser onCopy={handleCopy} copiedPath={copiedPath} />}
    </div>
  );
}

// ─── Static Vault Browser ────────────────────────────────────────────────────

function StaticVaultBrowser({
  onCopy,
  copiedPath
}: {
  onCopy: (value: any, label: string, path: string) => void;
  copiedPath: string | null;
}) {
  const [vaultData, setVaultData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal']));

  useEffect(() => {
    apiService.getAutofillData()
      .then(data => {
        setVaultData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load vault data:', err);
        setLoading(false);
      });
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const sections = [
    { key: 'personal', title: '📄 Personal Info', icon: '📄' },
    { key: 'professional', title: '💼 Professional', icon: '💼' },
    { key: 'work', title: '🏢 Work Experience', icon: '🏢' },
    { key: 'education', title: '🎓 Education', icon: '🎓' },
    { key: 'skills', title: '🛠 Skills', icon: '🛠' },
    { key: 'legal', title: '📜 Legal & Compliance', icon: '📜' },
  ];

  if (loading) {
    return <div className="text-center text-sm text-gray-500 py-4">Loading vault...</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500 uppercase">Quick Access</h3>

      {sections.map(section => {
        const sectionData = vaultData[section.key];
        if (!sectionData) return null;

        const isExpanded = expandedSections.has(section.key);
        const items = flattenObject(sectionData);

        return (
          <div key={section.key} className="border rounded overflow-hidden">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
            >
              <span className="font-medium text-sm">{section.title}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="p-2 space-y-1 bg-white">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className="text-sm text-gray-900 truncate">{formatValue(item.value)}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopy(item.value, item.label, `${section.key}.${item.key}`)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition shrink-0"
                    >
                      {copiedPath === `${section.key}.${item.key}` ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenObject(obj: any, prefix = ''): { key: string; label: string; value: any }[] {
  const items: { key: string; label: string; value: any }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      items.push(...flattenObject(value, fullKey));
    } else if (value !== null && value !== undefined && value !== '') {
      items.push({
        key: fullKey,
        label: formatLabel(key),
        value,
      });
    }
  }

  return items;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(/[._]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}
