import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";

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

interface FieldMatch {
  fieldId: string;
  fieldName: string;
  matchedValue: any;
  confidence: number;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form auto-fill state
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [matches, setMatches] = useState<FieldMatch[]>([]);
  const [filling, setFilling] = useState(false);

  // ✅ Check login on popup open
  useEffect(() => {
    chrome.storage.local.get(["accessToken"], (result) => {
      if (result.accessToken) {
        setIsLoggedIn(true);
        detectForm(); // Auto-detect form on current tab
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
      const token = await getAccessToken();

      const res = await fetch("http://localhost:5000/api/extension/match-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields }),
      });

      const response = await res.json();

      if (response.success) {
        setMatches(response.data || []);
      }
    } catch (err) {
      console.error("Failed to match fields:", err);
    }
  };

  // ─── AUTO-FILL FORM ────────────────────────────────────
  const handleAutoFill = async () => {
    setFilling(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) return;

      const instructions = matches.map((match) => ({
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

  // ─── HELPERS ───────────────────────────────────────────
  const getAccessToken = (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(["accessToken"], (result) => {
        resolve(result.accessToken || "");
      });
    });
  };

  // ─── UI ────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="p-4 w-[380px]">
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
    <div className="p-4 w-[380px]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">AutoVault</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {currentForm ? (
        <Card className="p-4">
          <h2 className="font-semibold mb-2">{currentForm.title}</h2>
          <p className="text-sm text-gray-600 mb-3">
            {currentForm.fields.length} fields detected
          </p>

          {matches.length > 0 ? (
            <>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {matches.map((match) => (
                  <div key={match.fieldId} className="flex justify-between items-center text-sm">
                    <span className="truncate flex-1">{match.fieldName}</span>
                    <Badge variant={match.confidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(match.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={handleAutoFill}
                disabled={filling}
              >
                {filling ? "Filling..." : `Auto-fill ${matches.length} fields`}
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500">No matching fields found in your vault</p>
          )}
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500 mb-3">No form detected on this page</p>
          <Button onClick={detectForm} variant="outline" size="sm">
            Scan for Forms
          </Button>
        </Card>
      )}
    </div>
  );
}

export default App;