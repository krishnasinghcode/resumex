import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useVaultMeta } from '@/hooks/useVaultMeta';
import { userApi } from '@/api/user.api';
import { getErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  displayName: z.string().min(2, 'At least 2 characters'),
  avatar:      z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword:     z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const deleteSchema = z.object({
  password: z.string().min(1, 'Required'),
});

export default function ProfilePage() {
  const { user, setUser, clearAuth } = useAuthStore();
  const { logout } = useAuth();
  const { meta }   = useVaultMeta();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [profileLoading,  setProfileLoading]  = useState(false);
  const [profileError,    setProfileError]    = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError,   setPasswordError]   = useState<string | null>(null);
  const [deleteOpen,      setDeleteOpen]      = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName ?? '', avatar: user?.avatar ?? '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const deleteForm = useForm({
    resolver: zodResolver(deleteSchema),
    defaultValues: { password: '' },
  });

  // Sync form when user changes
  useEffect(() => {
    if (user) profileForm.reset({ displayName: user.displayName, avatar: user.avatar ?? '' });
  }, [user]);

  const saveProfile = async (data: { displayName: string; avatar?: string }) => {
    setProfileLoading(true); setProfileError(null);
    try {
      const updated = await userApi.updateProfile({ displayName: data.displayName, avatar: data.avatar || undefined });
      setUser(updated);
      toast({ variant: 'success', title: 'Profile updated' });
    } catch (e) {
      setProfileError(getErrorMessage(e));
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (data: { currentPassword: string; newPassword: string }) => {
    setPasswordLoading(true); setPasswordError(null);
    try {
      await userApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      passwordForm.reset();
      toast({ variant: 'success', title: 'Password changed' });
    } catch (e) {
      setPasswordError(getErrorMessage(e));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDelete = async (data: { password: string }) => {
    setDeleteLoading(true); setDeleteError(null);
    try {
      await userApi.deleteAccount({ password: data.password });
      clearAuth();
      navigate('/login');
    } catch (e) {
      setDeleteError(getErrorMessage(e));
      setDeleteLoading(false);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'RX';

  return (
    <PageWrapper meta={meta}>
      <div className="p-6 max-w-xl mx-auto page-enter space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account details and security</p>
        </div>

        {/* ── Profile info ─────────────────────────────────────────── */}
        <section className="rounded-xl border bg-card p-5 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-blue-600 text-white font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{user?.authProvider}</Badge>
                <Badge variant="secondary" className="text-xs">{user?.role}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {profileError && <ErrorBanner message={profileError} onDismiss={() => setProfileError(null)} />}

          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...profileForm.register('displayName')} />
              {profileForm.formState.errors.displayName && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatar">Avatar URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="avatar" type="url" placeholder="https://example.com/photo.jpg" {...profileForm.register('avatar')} />
              {profileForm.formState.errors.avatar && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.avatar.message}</p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </section>

        {/* ── Change password (local accounts only) ────────────────── */}
        <section className="rounded-xl border bg-card p-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm">{user?.authProvider === 'google' ? 'Set password for extension login' : 'Change password'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a strong password with 8+ characters</p>
            </div>

            <Separator />

            {passwordError && <ErrorBanner message={passwordError} onDismiss={() => setPasswordError(null)} />}

            <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4">
              {user?.authProvider !== 'google' && (<div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>)}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" size="sm" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </section>

        {/* ── Danger zone ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-destructive/20 bg-card p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-destructive">Danger zone</h2>
            <p className="text-xs text-muted-foreground mt-0.5">These actions are permanent and cannot be undone</p>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign out of all devices
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete account
            </Button>
          </div>
        </section>

      </div>

      {/* Delete account confirmation dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description="This permanently deletes your account and all vault data. This cannot be undone."
        confirmLabel="Yes, delete everything"
        onConfirm={deleteForm.handleSubmit(handleDelete)}
        loading={deleteLoading}
      />

      {/* Password prompt inside dialog — shown separately */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto bg-background rounded-xl border shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-1">Confirm with your password</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your current password to confirm deletion</p>
            {deleteError && <ErrorBanner message={deleteError} className="mb-3" />}
            <div className="space-y-3">
              <Input type="password" placeholder="Your password" {...deleteForm.register('password')} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDeleteOpen(false); deleteForm.reset(); setDeleteError(null); }} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={deleteForm.handleSubmit(handleDelete)} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting…' : 'Delete account'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}





