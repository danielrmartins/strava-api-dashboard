import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const TOKENS_PATH = path.resolve(process.cwd(), 'tokens.json');

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  athlete_id: number;
}

export async function saveTokens(data: TokenData): Promise<void> {
  await fs.writeFile(TOKENS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function loadTokens(): Promise<TokenData | null> {
  try {
    const raw = await fs.readFile(TOKENS_PATH, 'utf-8');
    return JSON.parse(raw) as TokenData;
  } catch {
    return null;
  }
}

export function isTokenExpired(tokens: TokenData): boolean {
  // expires_at is Unix timestamp in seconds; add 5-minute buffer
  return Date.now() / 1000 >= tokens.expires_at - 300;
}

export async function refreshAccessToken(tokens: TokenData): Promise<TokenData> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET not set');
  }

  const response = await axios.post<TokenData>(
    'https://www.strava.com/oauth/token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }
  );

  const refreshed: TokenData = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_at: response.data.expires_at,
    token_type: response.data.token_type,
    athlete_id: tokens.athlete_id,
  };

  await saveTokens(refreshed);
  return refreshed;
}

export async function getValidToken(): Promise<string> {
  const tokens = await loadTokens();

  if (!tokens) {
    throw new Error('Not authenticated. Please visit /auth/strava to connect your account.');
  }

  if (isTokenExpired(tokens)) {
    const refreshed = await refreshAccessToken(tokens);
    return refreshed.access_token;
  }

  return tokens.access_token;
}
