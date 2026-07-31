import Constants from 'expo-constants';

// Derive the dev machine's LAN IP from the Metro host so physical devices
// (Expo Go) reach the backend without manual configuration.
export function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri: string | undefined =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4545`;
  }
  return 'http://localhost:4545';
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(String(data.error || `Request failed (${status})`));
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = 'GET', body, token } = options;
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
