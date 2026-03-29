import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { ConsentCard } from '@/components/consent/ConsentCard';
import { useConsent } from '@/hooks/useConsent';
import { Shield, Building2, CheckCircle2 } from 'lucide-react';

export default function ConsentPage() {
  const { refCode }   = useParams<{ refCode: string }>();
  const navigate      = useNavigate();
  const { refIDData, loading, granting, error, granted, lookupRefID, grant } = useConsent();

  useEffect(() => {
    if (refCode) void lookupRefID(refCode);
  }, [refCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !refIDData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <ErrorBanner message={error} />
          <Button variant="outline" className="w-full" onClick={() => navigate('/connect')}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (granted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Access Granted</h2>
          <p className="text-muted-foreground text-sm">
            {refIDData?.companyId?.name} can now view your approved profile data.
            You can revoke this access at any time from your dashboard.
          </p>
          <Button className="w-full" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const company = refIDData?.companyId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">{company?.name} is requesting access</h1>
          <p className="text-muted-foreground text-sm">
            For the role: <span className="font-medium text-foreground">{refIDData?.jobTitle}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Access duration: {refIDData?.accessDuration} days from today
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            They are requesting the following sections:
          </p>
          {refIDData?.requestedFields?.map((field: any) => (
            <ConsentCard key={field.section} requestedField={field} />
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Only the sections listed above will be shared. Private fields are never shared.
            You can revoke access at any time from your dashboard.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/connect')} disabled={granting}>
            Deny
          </Button>
          <Button className="flex-1" onClick={() => refCode && grant(refCode)} disabled={granting}>
            {granting ? 'Granting…' : 'Allow Access'}
          </Button>
        </div>
      </div>
    </div>
  );
}
