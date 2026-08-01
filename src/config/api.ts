// Deployed backend. Override with EXPO_PUBLIC_API_URL when developing
// against a local server (e.g. http://192.168.1.37:4545).
const PRODUCTION_API_URL = 'https://expensetrackers-fl9k.onrender.com';

export function getApiBase(): string {
  return process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
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
