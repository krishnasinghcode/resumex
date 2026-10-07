import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { CandidateRow } from '@/components/company/CandidateRow';
import { companyApi } from '@/api/company.api';
import { getErrorMessage } from '@/api/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RefIDDetailPage() {
  const { refCode }                   = useParams<{ refCode: string }>();
  const navigate                      = useNavigate();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Sandbox state
  const [sqlQuery, setSqlQuery] = useState("SELECT displayName, email, work_experience FROM ?");
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  useEffect(() => {
    if (!refCode) return;
    companyApi.getRefIDCandidates(refCode)
      .then(res => setData(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [refCode]);

  const runSandboxQuery = async () => {
    if (!refCode) return;
    setSandboxLoading(true);
    setSandboxError(null);
    try {
      const res = await companyApi.runSandboxQuery(refCode, sqlQuery);
      setSandboxResult(res.data.data.result);
    } catch (err: any) {
      setSandboxError(err.response?.data?.message || getErrorMessage(err));
    } finally {
      setSandboxLoading(false);
    }
  };

  const sandboxExamples = [
    {
      title: "Find Candidates with Specific Experience",
      query: "SELECT displayName, email FROM ? WHERE SEARCH('work_experience / company=\"Google\"')",
    },
    {
      title: "Find Candidates by Skill",
      query: "SELECT displayName FROM ? WHERE SEARCH('skills / name=\"React\"')",
    },
    {
      title: "Count Total Candidates",
      query: "SELECT COUNT(*) as total_applicants FROM ?",
    },
    {
      title: "Find Candidates with Master's Degree",
      query: "SELECT displayName, education FROM ? WHERE SEARCH('education / degree LIKE \"%Master%\"')",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/company/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold">{data?.refID?.jobTitle ?? 'Loading...'}</h1>
          <p className="text-xs text-muted-foreground font-mono">{refCode}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {loading && <LoadingSpinner />}
        {error   && <ErrorBanner message={error} />}
        
        {!loading && !error && data?.permissions?.length === 0 && (
          <EmptyState
            title="No candidates yet"
            description="Share this RefID with candidates to start receiving applications."
          />
        )}
        
        {!loading && data?.permissions?.length > 0 && (
          <>
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-lg font-semibold">SQL Sandbox (Advanced Search)</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Examples
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>SQL Query Examples</DialogTitle>
                      <DialogDescription>
                        Because candidate data like `work_experience` or `skills` are arrays, you can use Alasql's `SEARCH()` function to find matches inside nested properties.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {sandboxExamples.map((ex, i) => (
                        <div key={i} className="border p-3 rounded-md space-y-2 bg-muted/30">
                          <h4 className="text-sm font-semibold">{ex.title}</h4>
                          <code className="block text-xs bg-muted p-2 rounded select-all cursor-pointer" onClick={() => setSqlQuery(ex.query)}>
                            {ex.query}
                          </code>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-sm text-muted-foreground">
                Query candidate data directly using SQL. The candidates list is available as the <code>?</code> table. Use <code>-&gt;</code> for nested JSON properties (e.g. <code>SEARCH('work_experience / company="Google"')</code> or standard SQL).
              </p>
              
              <div className="flex gap-2 items-start">
                <textarea 
                  className="flex-1 min-h-[100px] p-3 font-mono text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM ?"
                />
                <Button onClick={runSandboxQuery} disabled={sandboxLoading} className="gap-2">
                  <Play className="w-4 h-4" />
                  Run
                </Button>
              </div>

              {sandboxError && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md">{sandboxError}</div>}
              
              {sandboxResult && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-xs font-semibold flex justify-between">
                    <span>Query Result</span>
                    <span>{Array.isArray(sandboxResult) ? `${sandboxResult.length} rows` : '1 result'}</span>
                  </div>
                  <pre className="p-4 text-xs overflow-auto max-h-[400px] bg-card">
                    {JSON.stringify(sandboxResult, null, 2)}
                  </pre>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">All Candidates</h2>
              <div className="border rounded-lg overflow-hidden">
                {data.permissions.map((perm: any) => (
                  <CandidateRow key={perm._id} permission={perm} refCode={refCode!} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
