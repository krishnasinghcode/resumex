export const setTokens = (accessToken: string, refreshToken: string) => {
  chrome.storage.local.set({ accessToken, refreshToken });
};

export const getAccessToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["accessToken"], (result) => {
      resolve(result.accessToken || null);
    });
  });
};