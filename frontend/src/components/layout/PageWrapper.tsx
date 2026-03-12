import { useUIStore } from '@/store/ui.store';
import { Sidebar } from './Sidebar';
import type { VaultMeta } from '@/types/vault.types';

interface PageWrapperProps {
  children: React.ReactNode;
  meta?: VaultMeta | null;
}

export function PageWrapper({ children, meta }: PageWrapperProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar meta={meta} />

      {/* Main content — shifts based on sidebar width */}
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '64px' }}
      >
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
