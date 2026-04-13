import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { saveTokens, loadTokens, type TokenData } from '../services/tokenService.js';

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
  scope?: string;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /auth/strava — redirects user to Strava OAuth2 login
  fastify.get('/auth/strava', async (_req: FastifyRequest, reply: FastifyReply) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return reply.status(500).send({ error: 'Server misconfiguration: missing env vars' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
    });

    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    return reply.redirect(stravaAuthUrl);
  });

  // GET /auth/callback — receives the code from Strava and exchanges it for tokens
  fastify.get<{ Querystring: CallbackQuery }>(
    '/auth/callback',
    async (req: FastifyRequest<{ Querystring: CallbackQuery }>, reply: FastifyReply) => {
      const { code, error } = req.query;

      if (error) {
        return reply.status(400).send({ error: `Strava authorization denied: ${error}` });
      }

      if (!code) {
        return reply.status(400).send({ error: 'Missing authorization code' });
      }

      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;
      const redirectUri = process.env.REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return reply.status(500).send({ error: 'Server misconfiguration: missing env vars' });
      }

      try {
        const response = await axios.post<StravaTokenResponse>(
          'https://www.strava.com/oauth/token',
          {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
          }
        );

        const { access_token, refresh_token, expires_at, token_type, athlete } = response.data;

        const tokens: TokenData = {
          access_token,
          refresh_token,
          expires_at,
          token_type,
          athlete_id: athlete.id,
        };

        await saveTokens(tokens);

        fastify.log.info(`Authenticated athlete: ${athlete.firstname} ${athlete.lastname} (ID: ${athlete.id})`);

        return reply.send({
          message: 'Authentication successful!',
          athlete: {
            id: athlete.id,
            username: athlete.username,
            name: `${athlete.firstname} ${athlete.lastname}`,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'Failed to exchange code for token');

        if (axios.isAxiosError(err)) {
          return reply.status(502).send({
            error: 'Failed to obtain token from Strava',
            details: err.response?.data,
          });
        }

        return reply.status(500).send({ error: 'Internal server error during authentication' });
      }
    }
  );

  // GET /auth/status — checks if the user is currently authenticated
  fastify.get('/auth/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    const tokens = await loadTokens();

    if (!tokens) {
      return reply.send({ authenticated: false });
    }

    const now = Date.now() / 1000;
    const expiresIn = Math.max(0, Math.round(tokens.expires_at - now));

    return reply.send({
      authenticated: true,
      athlete_id: tokens.athlete_id,
      expires_in_seconds: expiresIn,
      expired: expiresIn === 0,
    });
  });
}
