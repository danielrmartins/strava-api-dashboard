import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { getValidToken } from '../services/tokenService.js';

export interface HRZone {
  min: number;
  max: number; // -1 means no upper limit
}

export interface AthleteZones {
  heart_rate: {
    custom_zones: boolean;
    zones: HRZone[];
  };
}

export async function athleteRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/athlete/zones', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await getValidToken();
      const response = await axios.get<AthleteZones>(
        'https://www.strava.com/api/v3/athlete/zones',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return reply.send(response.data.heart_rate.zones);
    } catch (err) {
      fastify.log.error(err, 'Failed to fetch athlete zones');
      return reply.status(500).send({ error: 'Failed to fetch HR zones' });
    }
  });
}
