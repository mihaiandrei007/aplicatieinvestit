import { API_URL } from '../config';

/** Error carrying the message returned by the API. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

/** Sets the token used for authenticated requests. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** The current token (for the WebSocket connection). */
export function getAuthToken(): string | null {
  return authToken;
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
    throw new ApiError(res.status, (data as { error?: string }).error ?? `Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
};

// ---- Types shared with the backend ----

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  cash: number;
  startingCash: number;
  role?: string | null;
  experience?: string | null;
  isAdmin?: boolean;
}

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  cash: number;
  currentStreak: number;
  role?: string | null;
  experience?: string | null;
  trades: number;
  predictions: number;
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
  tradeCredits: number;
  currentStreak: number;
  holdings: Holding[];
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  tradeCredits: number;
  checkedInToday: boolean;
}

export interface CheckInResult {
  alreadyCheckedIn: boolean;
  currentStreak: number;
  longestStreak: number;
  freezes: number;
  creditsGranted: number;
  tradeCredits: number;
  usedFreeze?: boolean;
  earnedFreeze?: boolean;
}

export interface NewsItem {
  id: string;
  symbol: string | null;
  headline: string;
  body: string;
  source: string;
  createdAt: string;
}

export interface DailyChallenge {
  date: string;
  symbol: string;
  name: string;
  startPrice: number;
  currentPrice: number;
  myDirection: 'UP' | 'DOWN' | null;
  votesUp: number;
  votesDown: number;
  reward: { cash: number; credits: number };
}

export interface Wrapped {
  displayName: string;
  equity: number;
  roi: number;
  tradeCount: number;
  distinctSymbols: number;
  realizedPnL: number;
  currentStreak: number;
  badges: number;
  bestHolding: { symbol: string; unrealizedPnL: number } | null;
  predictions: { total: number; won: number; winRate: number };
}

export type SentimentValue = 'BULLISH' | 'BEARISH';

export interface GroupSentiment {
  symbol: string;
  bullish: number;
  bearish: number;
  total: number;
  bullishPct: number;
  myValue: SentimentValue | null;
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  sector: string | null;
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

export interface EquityPoint {
  equity: number;
  createdAt: string;
}

export interface TournamentSummary {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  participants: number;
}

export interface TournamentEntry {
  rank: number;
  userId: string;
  displayName: string;
  roi: number;
  equity: number;
  isMe: boolean;
}


// ---- Typed endpoints ----

export const endpoints = {
  register: (email: string, password: string, displayName: string, extras?: { role?: string; experience?: string }) =>
    api.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      displayName,
      ...(extras?.role ? { role: extras.role } : {}),
      ...(extras?.experience ? { experience: extras.experience } : {}),
    }),
  login: (email: string, password: string) => api.post<AuthResponse>('/api/auth/login', { email, password }),
  me: () => api.get<{ user: PublicUser }>('/api/auth/me'),

  adminUsers: () => api.get<{ users: AdminUser[] }>('/api/admin/users'),

  portfolio: () => api.get<PortfolioSnapshot>('/api/portfolio'),
  instruments: () => api.get<{ instruments: Instrument[] }>('/api/instruments'),
  trade: (symbol: string, side: 'BUY' | 'SELL', quantity: number) =>
    api.post<{ cash: number; tradeCredits: number; newBadges: Array<{ code: string; label: string }> }>(
      '/api/portfolio/trade',
      { symbol, side, quantity },
    ),

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

  // Stage 3 — push & OAuth
  oauth: (provider: 'google' | 'apple', idToken: string) =>
    api.post<AuthResponse>('/api/auth/oauth', { provider, idToken }),
  registerPush: (token: string) => api.post('/api/push/register', { token }),

  // portfolio chart
  history: () => api.get<{ history: EquityPoint[] }>('/api/portfolio/history'),

  // Stage 4 — tournaments
  tournaments: (groupId: string) =>
    api.get<{ tournaments: TournamentSummary[] }>(`/api/groups/${groupId}/tournaments`),
  createTournament: (groupId: string, name: string, startsAt: string, endsAt: string) =>
    api.post<{ tournament: { id: string; name: string } }>(`/api/groups/${groupId}/tournaments`, {
      name,
      startsAt,
      endsAt,
    }),
  joinTournament: (id: string) => api.post(`/api/tournaments/${id}/join`),
  tournamentLeaderboard: (id: string) =>
    api.get<{ tournament: { id: string; name: string }; leaderboard: TournamentEntry[] }>(
      `/api/tournaments/${id}/leaderboard`,
    ),

  // Quick wins — streak & sentiment
  streak: () => api.get<StreakState>('/api/me/streak'),
  checkIn: () => api.post<CheckInResult>('/api/me/checkin'),
  setSentiment: (symbol: string, value: SentimentValue) =>
    api.post<{ symbol: string; myValue: SentimentValue | null }>('/api/sentiment', { symbol, value }),
  groupSentiment: (groupId: string) =>
    api.get<{ sentiment: GroupSentiment[] }>(`/api/groups/${groupId}/sentiment`),

  news: () => api.get<{ news: NewsItem[] }>('/api/market/news'),

  // #11 watchlist
  watchlist: () => api.get<{ symbols: string[] }>('/api/watchlist'),
  toggleWatch: (symbol: string) => api.post<{ symbol: string; watching: boolean }>('/api/watchlist', { symbol }),

  // #13 daily challenge
  daily: () => api.get<DailyChallenge>('/api/daily'),
  voteDaily: (direction: 'UP' | 'DOWN') => api.post<DailyChallenge>('/api/daily', { direction }),

  // #12 wrapped
  wrapped: () => api.get<Wrapped>('/api/wrapped'),

  // #8 Sharpe leaderboard
  sharpeLeaderboard: (groupId: string) =>
    api.get<{ group: { id: string; name: string }; leaderboard: Array<{ rank: number; userId: string; displayName: string; sharpe: number; isMe: boolean }> }>(
      `/api/groups/${groupId}/leaderboard/sharpe`,
    ),

  // Quick prediction (themed semi-gambling)
  predictionRules: () => api.get<{ multiplier: number; minStake: number; maxStake: number }>('/api/predictions'),
  placePrediction: (symbol: string, direction: 'UP' | 'DOWN', stake: number) =>
    api.post<{ prediction: { id: string; symbol: string; direction: string; priceAtBet: number }; cash: number }>(
      '/api/predictions',
      { symbol, direction, stake },
    ),
};
