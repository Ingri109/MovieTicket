// Заміни порт 7000 на той, на якому реально запускається твій .NET API (див. у Rider або launchSettings.json)
export const BACKEND_URL = `${process.env.BACKEND_URL}/api`;
if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

// Універсальний конфіг для fetch запитів (допоможе передавати токен, якщо потрібно)
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  return fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}