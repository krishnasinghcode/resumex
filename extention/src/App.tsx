import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Check login on popup open
  useEffect(() => {
    chrome.storage.local.get(["accessToken"], (result) => {
      if (result.accessToken) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  // ─── LOGIN ─────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);

    try {
      console.log("➡️ Sending login request...");

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("STATUS:", res.status);

      const response = await res.json();
      console.log("RESPONSE:", response);

      if (!res.ok) {
        throw new Error(response.message || "Login failed");
      }

      // ⚠️ IMPORTANT: your backend likely wraps data
      const data = response.data || response;

      console.log("TOKENS:", data);

      chrome.storage.local.set(
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        () => {
          console.log("✅ Tokens saved");
        }
      );

      setIsLoggedIn(true);
    } catch (err: any) {
      console.error("❌ LOGIN ERROR:", err);
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── FETCH USER ────────────────────────────────────────
  const handleFetchUser = async () => {
    chrome.storage.local.get(["accessToken"], async (result) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
          },
        });

        const data = await res.json();
        console.log("User:", data);
        alert("Check console for user data");
      } catch (err) {
        console.error(err);
      }
    });
  };

  // ─── LOGOUT ────────────────────────────────────────────
  const handleLogout = async () => {
    chrome.storage.local.get(
      ["accessToken", "refreshToken"],
      async (result) => {
        try {
          await fetch("http://localhost:5000/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${result.accessToken}`,
            },
            body: JSON.stringify({
              refreshToken: result.refreshToken,
            }),
          });
        } catch (err) {
          console.error("Logout error", err);
        }

        chrome.storage.local.remove(["accessToken", "refreshToken"]);
        setIsLoggedIn(false);
      }
    );
  };

  // ─── UI ────────────────────────────────────────────────
  return (
    <div className="p-4 w-[320px]">
      {isLoggedIn ? (
        <>
          <h1 className="text-xl font-bold mb-4">Dashboard</h1>

          <Button className="w-full" onClick={handleFetchUser}>
            Fetch User Data
          </Button>

          <Button
            className="mt-2 w-full"
            variant="destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold mb-4">Login</h1>

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

          <Button
            className="mt-4 w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </>
      )}
    </div>
  );
}

export default App;