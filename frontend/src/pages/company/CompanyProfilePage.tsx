import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useCompanyStore } from '@/store/company.store';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';

export default function CompanyProfilePage() {
  const navigate    = useNavigate();
  const company     = useCompanyStore(s => s.company);
  const setAuth     = useCompanyStore(s => s.setAuth);
  const accessToken = useCompanyStore(s => s.accessToken);

  const [name,     setName]     = useState(company?.name     ?? '');
  const [website,  setWebsite]  = useState(company?.website  ?? '');
  const [industry, setIndustry] = useState(company?.industry ?? '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Password change state
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [pwSaving,         setPwSaving]         = useState(false);
  const [pwError,          setPwError]          = useState<string | null>(null);
  const [pwSaved,          setPwSaved]          = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      const { data } = await companyApi.updateProfile({ name, website, industry });
      // Refresh store with updated company info
      if (accessToken) setAuth(accessToken, data.data.company);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null); setPwSaved(false);

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }

    setPwSaving(true);
    try {
      await companyApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">Company Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your company information</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-8">

        {/* Company avatar / slug badge */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{company?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              Slug: <span className="uppercase">{company?.slug}</span>
              <span className="ml-1 text-muted-foreground/60">(used in RefID codes — cannot change)</span>
            </p>
          </div>
        </div>

        {/* Profile form */}
        <section className="space-y-4">
          <h2 className="font-semibold text-sm">Company Info</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://yourcompany.com" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="e.g. HR Tech, FinTech" value={industry} onChange={e => setIndustry(e.target.value)} />
            </div>

            {error && <ErrorBanner message={error} />}

            <Button type="submit" disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </Button>
          </form>
        </section>

        <div className="border-t" />

        {/* Password change */}
        <section className="space-y-4">
          <h2 className="font-semibold text-sm">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            {pwError && <ErrorBanner message={pwError} />}

            <Button type="submit" variant="outline" disabled={pwSaving} className="w-full">
              {pwSaving ? 'Updating…' : pwSaved ? '✓ Password updated' : 'Update Password'}
            </Button>
          </form>
        </section>

      </main>
    </div>
  );
}
