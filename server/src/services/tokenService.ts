import axios from 'axios';
import { storage } from './storageService.js';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  athlete_id: number;
  athlete_name: string;
  athlete_username: string;
}

const tokenKey = (sid: string) => `session:${sid}:tokens`;

export async function saveTokens(sid: string, data: TokenData): Promise<void> {
  await storage.set(tokenKey(sid), data);
}

export async function loadTokens(sid: string): Promise<TokenData | null> {
  return storage.get<TokenData>(tokenKey(sid));
}

export async function deleteTokens(sid: string): Promise<void> {
  await storage.del(tokenKey(sid));
}

export function isTokenExpired(tokens: TokenData): boolean {
  return Date.now() / 1000 >= tokens.expires_at - 300;
}

export async function refreshAccessToken(sid: string, tokens: TokenData): Promise<TokenData> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET not set');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });

  const response = await axios.post<TokenData>(
    'https://www.strava.com/oauth/token',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const refreshed: TokenData = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: response.data.expires_at,
    token_type: response.data.token_type,
    athlete_id: tokens.athlete_id,
    athlete_name: tokens.athlete_name,
    athlete_username: tokens.athlete_username,
  };

  await saveTokens(sid, refreshed);
  return refreshed;
}

export async function getValidToken(sid: string): Promise<string> {
  const tokens = await loadTokens(sid);

  if (!tokens) {
    throw new Error('Not authenticated. Please visit /auth/strava to connect your account.');
  }

  if (isTokenExpired(tokens)) {
    const refreshed = await refreshAccessToken(sid, tokens);
    return refreshed.access_token;
  }

  return tokens.access_token;
}
