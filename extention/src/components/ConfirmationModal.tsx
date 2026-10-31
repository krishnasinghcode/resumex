import { useState } from 'react';
import { Check, X, Edit2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FieldMatch } from '../services/api.service';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  matches: FieldMatch[];
  onConfirm: (selectedMatches: FieldMatch[]) => void;
  onCancel: () => void;
}

export function ConfirmationModal({ matches, onConfirm, onCancel }: ConfirmationModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedMatches, setSelectedMatches] = useState<FieldMatch[]>(matches);

  const handleToggle = (fieldId: string) => {
    setSelectedMatches(prev =>
      prev.some(m => m.fieldId === fieldId)
        ? prev.filter(m => m.fieldId !== fieldId)
        : [...prev, matches.find(m => m.fieldId === fieldId)!]
    );
  };

  const handleEdit = (match: FieldMatch) => {
    setEditingId(match.fieldId);
    setEditValue(String(match.matchedValue));
  };

  const handleSaveEdit = (fieldId: string) => {
    setSelectedMatches(prev =>
      prev.map(m =>
        m.fieldId === fieldId ? { ...m, matchedValue: editValue } : m
      )
    );
    setEditingId(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.75) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Review Auto-fill</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedMatches.length} of {matches.length} fields selected
          </p>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {matches.map(match => {
            const isSelected = selectedMatches.some(m => m.fieldId === match.fieldId);
            const isEditing = editingId === match.fieldId;

            return (
              <div
                key={match.fieldId}
                className={cn(
                  'border rounded-lg p-3 transition',
                  isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
                )}
              >
                {/* Field Name + Confidence */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{match.fieldName}</div>
                    <div className="text-xs text-gray-500">{match.section}</div>
                  </div>
                  <div className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    getConfidenceColor(match.confidence)
                  )}>
                    {Math.round(match.confidence * 100)}%
                  </div>
                </div>

                {/* Value */}
                {isEditing ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(match.fieldId)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      {String(match.matchedValue)}
                    </code>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(match)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(match.fieldId)}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Low Confidence Warning */}
          {matches.some(m => m.confidence < 0.75) && (
            <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <div className="text-sm text-yellow-800">
                Some fields have lower confidence. Review carefully before filling.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedMatches)}
            className="flex-1"
            disabled={selectedMatches.length === 0}
          >
            Fill {selectedMatches.length} Field{selectedMatches.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}