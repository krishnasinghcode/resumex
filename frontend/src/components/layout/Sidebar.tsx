import { NavLink, useNavigate } from 'react-router-dom';
import { Search, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTION_CONFIG } from '@/lib/constants';
import { ALL_SECTION_KEYS, type SectionKey, type VaultMeta } from '@/types/vault.types';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  meta?: VaultMeta | null;
}

export function Sidebar({ meta }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const completedCount = meta
    ? ALL_SECTION_KEYS.filter(k => meta.sections[k]?.isComplete).length
    : 0;

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'RX';

  return (
    <aside
      className={cn(
        'flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out',
        'border-r border-white/[0.06]',
      )}
      style={{
        width: sidebarOpen ? 'var(--sidebar-width)' : '64px',
        background: 'hsl(var(--sidebar-bg))',
      }}
    >
      {/* ── Logo + collapse toggle ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] flex-shrink-0">
        {sidebarOpen && (
          <button onClick={() => navigate('/')} className="flex items-center gap-2 focus:outline-none">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">RX</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">ResumeX</span>
          </button>
        )}
        {!sidebarOpen && (
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">RX</span>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Expand button when collapsed ─────────────────────────── */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 bg-blue-500 text-white rounded-full p-0.5 shadow-md z-10"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ── Completion bar ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Profile</span>
            <span className="text-[11px] text-white/60 font-mono">{completedCount}/14</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 14) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Nav links ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">

        {/* Search */}
        <NavLink
          to="/search"
          className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          title={!sidebarOpen ? 'Search' : undefined}
        >
          <Search className="w-4 h-4 flex-shrink-0 sidebar-icon opacity-60" />
          {sidebarOpen && <span>Search</span>}
        </NavLink>

        {/* Divider */}
        {sidebarOpen && (
          <div className="px-3 pt-3 pb-1">
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Vault</span>
          </div>
        )}
        {!sidebarOpen && <div className="h-px bg-white/[0.06] mx-1 my-1" />}

        {/* Section links */}
        {ALL_SECTION_KEYS.map((key: SectionKey) => {
          const config = SECTION_CONFIG[key];
          const sectionMeta = meta?.sections[key];
          const isComplete = sectionMeta?.isComplete ?? false;
          const isPrivate  = sectionMeta?.isPrivate  ?? false;

          return (
            <NavLink
              key={key}
              to={`/vault/${key}`}
              className={({ isActive }) => cn('sidebar-link group', isActive && 'active')}
              title={!sidebarOpen ? config.label : undefined}
            >
              <span className="text-base flex-shrink-0 leading-none">{config.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1 truncate text-sm">{config.label}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isPrivate && (
                      <span className="text-[10px] text-amber-400/70">🔒</span>
                    )}
                    <span className={cn('completion-dot', isComplete ? 'complete' : 'incomplete')} />
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer — user + logout ───────────────────────────────── */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <NavLink to="/profile" className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.displayName ?? 'User'}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.email ?? ''}</p>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="w-7 h-7 text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <NavLink to="/profile">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
            </NavLink>
            <Button variant="ghost" size="icon" onClick={logout} className="w-7 h-7 text-white/40 hover:text-white hover:bg-white/10" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
