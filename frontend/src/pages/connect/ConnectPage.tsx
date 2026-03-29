import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { Search } from 'lucide-react';
import { refidApi } from '@/api/refid.api';
import { getErrorMessage } from '@/api/axios';

export default function ConnectPage() {
  const navigate          = useNavigate();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError(null);
    try {
      await refidApi.getByCode(code.trim().toUpperCase());
      navigate(`/consent/${code.trim().toUpperCase()}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Connect with a Company</h1>
          <p className="text-muted-foreground text-sm">
            Enter the RefID from the job posting to share your ResumeX profile.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">RefID Code</Label>
            <Input
              id="code"
              placeholder="RESUMEX-STR-FEND-4A7FK2M9-2026"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="font-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              You can find this code in the job posting or the company's application instructions.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Looking up…' : 'Look up RefID'}
          </Button>
        </form>
      </div>
    </div>
  );
}
