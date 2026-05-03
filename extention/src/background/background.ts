// ─── Background Service Worker ──────────────────────────────────────────────
// Handles API requests and token refresh

const API_BASE = 'http://localhost:5000/api';

// Listen for form detection to show badge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FORM_DETECTED') {
    // Show badge on extension icon
    if (sender.tab?.id) {
      chrome.action.setBadgeText({
        text: String(message.fieldCount),
        tabId: sender.tab.id,
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#10b981',
        tabId: sender.tab.id,
      });
    }
  }
});

// Helper: Get access token
async function getAccessToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], (result) => {
      resolve(result.accessToken || null);
    });
  });
}

// Helper: Fetch with auth
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Handle token refresh if 401
  if (response.status === 401) {
    // Could implement token refresh here
    throw new Error('Session expired');
  }

  return response;
}