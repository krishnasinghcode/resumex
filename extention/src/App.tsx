import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { VaultBrowser } from "./components/VaultBrowser";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { apiService, FieldMatch } from "./services/api.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

interface ParsedField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
}

interface FormData {
  title: string;
  url: string;
  fields: ParsedField[];
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form auto-fill state
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [matches, setMatches] = useState<FieldMatch[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filling, setFilling] = useState(false);

  // ✅ Check login on popup open
  useEffect(() => {
    chrome.storage.local.get(["accessToken"], (result) => {
      if (result.accessToken) {
        setIsLoggedIn(true);
        detectForm();
      }
    });
  }, []);

  // ─── LOGIN ─────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response.message || "Login failed");
      }

      const data = response.data || response;

      chrome.storage.local.set(
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        () => {
          setIsLoggedIn(true);
          detectForm();
        }
      );
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGOUT ────────────────────────────────────────────
  const handleLogout = async () => {
    chrome.storage.local.get(["accessToken", "refreshToken"], async (result) => {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${result.accessToken}`,
          },
          body: JSON.stringify({ refreshToken: result.refreshToken }),
        });
      } catch (err) {
        console.error("Logout error", err);
      }

      chrome.storage.local.remove(["accessToken", "refreshToken"]);
      setIsLoggedIn(false);
      setCurrentForm(null);
      setMatches([]);
    });
  };

  // ─── DETECT FORM ───────────────────────────────────────
  const detectForm = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) return;

    chrome.tabs.sendMessage(
      tab.id,
      { type: "PARSE_FORM" },
      async (response) => {
        if (response?.success && response.form) {
          setCurrentForm(response.form);
          await matchFields(response.form.fields);
        } else {
          setCurrentForm(null);
          setMatches([]);
        }
      }
    );
  };

  // ─── MATCH FIELDS ──────────────────────────────────────
  const matchFields = async (fields: ParsedField[]) => {
    try {
      const results = await apiService.matchFields(fields);
      setMatches(results);
    } catch (err) {
      console.error("Failed to match fields:", err);
    }
  };

  // ─── AUTO-FILL FORM ────────────────────────────────────
  const handleAutoFill = async (selectedMatches: FieldMatch[]) => {
    setFilling(true);
    setShowConfirmation(false);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) return;

      const instructions = selectedMatches.map((match) => ({
        fieldId: match.fieldId,
        value: match.matchedValue,
      }));

      chrome.tabs.sendMessage(
        tab.id,
        { type: "FILL_FORM", instructions },
        (response) => {
          if (response?.success) {
            alert(`✅ Filled ${response.filledCount} of ${response.totalFields} fields`);
          } else {
            alert("❌ Failed to fill form");
          }
          setFilling(false);
        }
      );
    } catch (err) {
      console.error("Auto-fill error:", err);
      setFilling(false);
    }
  };

  // ─── UI ────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="p-4 w-[400px]">
        <h1 className="text-xl font-bold mb-4">Login to AutoVault</h1>

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          className="mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button className="mt-4 w-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <h1 className="text-lg font-bold">AutoVault</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="autofill" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="autofill" className="flex-1">Auto-fill</TabsTrigger>
          <TabsTrigger value="vault" className="flex-1">Vault</TabsTrigger>
        </TabsList>

        {/* Auto-fill Tab */}
        <TabsContent value="autofill" className="flex-1 overflow-y-auto p-4">
          {currentForm ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="font-semibold mb-1">{currentForm.title}</h2>
                <p className="text-sm text-gray-600">
                  {currentForm.fields.length} fields detected
                </p>
              </div>

              {matches.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {matches.length} field{matches.length !== 1 ? 's' : ''} matched
                    </span>
                    <span className="text-xs text-gray-500">
                      Avg: {Math.round(matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length * 100)}%
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setShowConfirmation(true)}
                    disabled={filling}
                  >
                    {filling ? "Filling..." : "Review & Fill"}
                  </Button>

                  {/* Quick preview */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {matches.slice(0, 5).map((match) => (
                      <div
                        key={match.fieldId}
                        className="text-xs p-2 bg-white border rounded flex justify-between"
                      >
                        <span className="truncate flex-1">{match.fieldName}</span>
                        <span className={`font-medium ${
                          match.confidence > 0.8 ? 'text-green-600' :
                          match.confidence > 0.7 ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>
                          {Math.round(match.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                    {matches.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{matches.length - 5} more fields
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No matching fields found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try the Vault tab to manually copy data
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-3">No form detected on this page</p>
              <Button onClick={detectForm} variant="outline" size="sm">
                Scan for Forms
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Vault Tab */}
        <TabsContent value="vault" className="flex-1 overflow-y-auto p-4">
          <VaultBrowser />
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          matches={matches}
          onConfirm={handleAutoFill}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}

export default App;
