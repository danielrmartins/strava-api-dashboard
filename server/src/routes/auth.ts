import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { saveTokens, loadTokens, deleteTokens, type TokenData } from '../services/tokenService.js';
import { invalidateCache } from '../services/cacheService.js';

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

interface CallbackQuery {
  code?: string;
  error?: string;
  state?: string;
}

const COOKIE_NAME = 'sid';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

const FRONTEND_URL =
  process.env.FRONTEND_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /auth/strava — redirects to Strava OAuth
  fastify.get('/auth/strava', async (req: FastifyRequest, reply: FastifyReply) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return reply.status(500).send({ error: 'Server misconfiguration: missing env vars' });
    }

    // Generate session ID to be used after callback
    const sessionId = uuidv4();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
      state: sessionId, // passed back in callback
    });

    return reply.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
  });

  // GET /auth/callback — exchanges code for tokens, sets session cookie
  fastify.get<{ Querystring: CallbackQuery }>(
    '/auth/callback',
    async (req: FastifyRequest<{ Querystring: CallbackQuery }>, reply: FastifyReply) => {
      const { code, error, state } = req.query;

      if (error) {
        return reply.redirect(`${FRONTEND_URL}/?error=access_denied`);
      }

      if (!code) {
        return reply.redirect(`${FRONTEND_URL}/?error=missing_code`);
      }

      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;
      const redirectUri = process.env.REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        fastify.log.error('Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET or REDIRECT_URI');
        return reply.redirect(`${FRONTEND_URL}/?error=server_error`);
      }

      try {
        const params = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
        });

        const response = await axios.post<StravaTokenResponse>(
          'https://www.strava.com/oauth/token',
          params.toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token, expires_at, token_type, athlete } = response.data;

        // Use session ID from state param (set in /auth/strava) or generate new
        const sessionId = (typeof state === 'string' && state.length > 0)
          ? state
          : uuidv4();

        const tokens: TokenData = {
          access_token,
          refresh_token,
          expires_at,
          token_type,
          athlete_id: athlete.id,
          athlete_name: `${athlete.firstname} ${athlete.lastname}`,
          athlete_username: athlete.username,
        };

        await saveTokens(sessionId, tokens);

        fastify.log.info(
          `Authenticated: ${tokens.athlete_name} (${tokens.athlete_username}) — session ${sessionId.slice(0, 8)}`
        );

        reply.setCookie(COOKIE_NAME, sessionId, COOKIE_OPTIONS);
        return reply.redirect(`${FRONTEND_URL}/`);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          fastify.log.error(
            { status: err.response?.status, data: err.response?.data },
            'Failed to exchange code for token'
          );
          return reply.redirect(`${FRONTEND_URL}/?error=strava_token`);
        }
        fastify.log.error(err, 'Authentication failed after token exchange');
        return reply.redirect(`${FRONTEND_URL}/?error=server_error`);
      }
    }
  );

  // GET /auth/status — checks authentication state for the current session
  fastify.get('/auth/status', async (req: FastifyRequest, reply: FastifyReply) => {
    const sid = req.cookies[COOKIE_NAME];
    if (!sid) return reply.send({ authenticated: false });

    const tokens = await loadTokens(sid);
    if (!tokens) return reply.send({ authenticated: false });

    const now = Date.now() / 1000;
    const expiresIn = Math.max(0, Math.round(tokens.expires_at - now));

    return reply.send({
      authenticated: true,
      athlete_id: tokens.athlete_id,
      athlete_name: tokens.athlete_name,
      athlete_username: tokens.athlete_username,
      expires_in_seconds: expiresIn,
    });
  });

  // POST /auth/logout — clears the session
  fastify.post('/auth/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const sid = req.cookies[COOKIE_NAME];
    if (sid) {
      await deleteTokens(sid);
      await invalidateCache(sid);
    }
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return reply.send({ success: true });
  });
}
