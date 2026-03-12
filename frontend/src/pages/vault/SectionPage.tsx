import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { EntryCard } from '@/components/vault/EntryCard';
import { EntryForm } from '@/components/vault/EntryForm';
import { PrivacyToggle } from '@/components/vault/PrivacyToggle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSection } from '@/hooks/useSection';
import { useVaultMeta } from '@/hooks/useVaultMeta';
import { SECTION_CONFIG } from '@/lib/constants';
import { ALL_SECTION_KEYS, SINGLETON_SECTIONS, type SectionKey, type VaultEntry } from '@/types/vault.types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export default function SectionPage() {
  const { sectionKey } = useParams<{ sectionKey: string }>();
  const { toast }      = useToast();
  const { meta }       = useVaultMeta();

  // Validate sectionKey
  if (!sectionKey || !ALL_SECTION_KEYS.includes(sectionKey as SectionKey)) {
    return <Navigate to="/" replace />;
  }

  const key        = sectionKey as SectionKey;
  const config     = SECTION_CONFIG[key];
  const isSingleton = SINGLETON_SECTIONS.includes(key);

  const {
    section, loading, saving, error,
    addEntry, updateEntry, deleteEntry,
    toggleSectionPrivacy, toggleEntryPrivacy,
  } = useSection(key);

  const [formOpen,     setFormOpen]     = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const openAdd = () => {
    setEditingEntry(null);
    setFormOpen(true);
  };

  const openEdit = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>): Promise<boolean> => {
    let success: boolean;
    if (editingEntry) {
      success = await updateEntry(editingEntry._id, data);
      if (success) {
        toast({ variant: 'success', title: 'Saved', description: 'Entry updated successfully' });
        setFormOpen(false);
      }
    } else {
      success = await addEntry(data);
      if (success) {
        toast({ variant: 'success', title: 'Added', description: 'Entry added to your vault' });
        if (isSingleton) setFormOpen(false); // close on singleton save
      }
    }
    return success;
  };

  const handleDelete = async (entryId: string): Promise<boolean> => {
    setDeletingId(entryId);
    const success = await deleteEntry(entryId);
    setDeletingId(null);
    if (success) toast({ title: 'Deleted', description: 'Entry removed from your vault' });
    return success;
  };

  return (
    <PageWrapper meta={meta}>
      <div className="p-6 max-w-3xl mx-auto page-enter">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none select-none">{config.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{config.label}</h1>
                {section?.isPrivate && <Badge variant="private">Private</Badge>}
                {section?.entries.length === 0
                  ? <Badge variant="secondary">Empty</Badge>
                  : <Badge variant="success">
                      {section?.entries.filter(e => !e.isPrivate).length === 0 ? 'All private' : 'Active'}
                    </Badge>
                }
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
            </div>
          </div>

          {/* Section-level privacy toggle */}
          {section && (
            <PrivacyToggle
              isPrivate={section.isPrivate}
              onChange={(val) => void toggleSectionPrivacy(val)}
              label={section.isPrivate ? 'Private' : 'Public'}
            />
          )}
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} className="mb-4" />}

        {/* Add / Edit form — inline for singletons, dialog for collections */}
        {isSingleton ? (
          <div className={cn('rounded-xl border bg-card p-5 mb-6', loading && 'opacity-60')}>
            <h2 className="text-sm font-semibold mb-4">
              {section?.entries[0] ? 'Edit details' : 'Add details'}
            </h2>
            {loading
              ? <div className="space-y-3">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
              : <EntryForm
                  sectionKey={key}
                  entry={section?.entries[0] ?? null}
                  onSubmit={handleSubmit}
                  onCancel={() => {}}
                  saving={saving}
                />
            }
          </div>
        ) : (
          <>
            {/* Add entry button */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? '…' : `${section?.entries.length ?? 0} ${(section?.entries.length ?? 0) === 1 ? 'entry' : 'entries'}`}
              </p>
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4" />
                Add entry
              </Button>
            </div>

            {/* Entry list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : section?.entries.length === 0 ? (
              <EmptyState
                icon={config.icon}
                title={`No ${config.label.toLowerCase()} yet`}
                description={`Add your first entry to complete this section`}
                actionLabel="Add entry"
                onAction={openAdd}
              />
            ) : (
              <div className="space-y-3">
                {section?.entries.map(entry => (
                  <EntryCard
                    key={entry._id}
                    entry={entry}
                    sectionKey={key}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onTogglePrivacy={toggleEntryPrivacy}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}

            {/* Add / Edit dialog */}
            <Dialog open={formOpen} onOpenChange={(open) => { if (!saving) setFormOpen(open); }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? `Edit ${config.label}` : `Add ${config.label}`}
                  </DialogTitle>
                </DialogHeader>
                <EntryForm
                  sectionKey={key}
                  entry={editingEntry}
                  onSubmit={handleSubmit}
                  onCancel={() => setFormOpen(false)}
                  saving={saving}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
