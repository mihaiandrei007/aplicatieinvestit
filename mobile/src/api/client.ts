import { API_URL } from '../config';

/** Eroare cu mesajul venit de la API. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

/** Setează token-ul folosit la cererile autentificate. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? `Eroare ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
};

// ---- Tipuri partajate cu backend-ul ----

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  cash: number;
  startingCash: number;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface PortfolioSnapshot {
  cash: number;
  startingCash: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  holdings: Holding[];
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  inviteCode: string;
  role: string;
  memberCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  roi: number;
  equity: number;
  isMe: boolean;
}

export interface FeedEvent {
  id: string;
  type: string;
  createdAt: string;
  actor: string;
  message: string;
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }>;
  commentCount: number;
}

export interface BadgeView {
  code: string;
  label: string;
  description: string;
  earned: boolean;
  awardedAt: string | null;
}

// ---- Endpoint-uri tipate ----

export const endpoints = {
  register: (email: string, password: string, displayName: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password, displayName }),
  login: (email: string, password: string) => api.post<AuthResponse>('/api/auth/login', { email, password }),
  me: () => api.get<{ user: PublicUser }>('/api/auth/me'),

  portfolio: () => api.get<PortfolioSnapshot>('/api/portfolio'),
  instruments: () => api.get<{ instruments: Instrument[] }>('/api/instruments'),
  trade: (symbol: string, side: 'BUY' | 'SELL', quantity: number) =>
    api.post<{ cash: number; newBadges: Array<{ code: string; label: string }> }>('/api/portfolio/trade', {
      symbol,
      side,
      quantity,
    }),

  groups: () => api.get<{ groups: GroupSummary[] }>('/api/groups'),
  createGroup: (name: string) => api.post<{ group: { id: string; name: string; inviteCode: string } }>('/api/groups', { name }),
  joinGroup: (inviteCode: string) => api.post<{ group: { id: string; name: string } }>('/api/groups/join', { inviteCode }),
  leaderboard: (groupId: string) =>
    api.get<{ group: { id: string; name: string }; leaderboard: LeaderboardEntry[] }>(
      `/api/groups/${groupId}/leaderboard`,
    ),
  feed: (groupId: string) => api.get<{ total: number; events: FeedEvent[] }>(`/api/groups/${groupId}/feed`),
  react: (eventId: string, emoji: string) => api.post(`/api/events/${eventId}/reactions`, { emoji }),

  badges: () => api.get<{ badges: BadgeView[] }>('/api/me/badges'),
  missions: () =>
    api.get<{ progress: number; next: { id: string; title: string } | null; missions: Array<{ id: string; title: string; description: string; completed: boolean }> }>(
      '/api/academy/missions',
    ),
  completeMission: (id: string) => api.post(`/api/academy/missions/${id}/complete`),
};
