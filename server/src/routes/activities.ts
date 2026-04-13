import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getActivities, computeSummary } from '../services/activityService.js';
import { invalidateCache } from '../services/cacheService.js';

interface ActivitiesQuery {
  refresh?: string;
}

export async function activityRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /activities — returns all processed runs (cached)
  fastify.get<{ Querystring: ActivitiesQuery }>(
    '/activities',
    async (req: FastifyRequest<{ Querystring: ActivitiesQuery }>, reply: FastifyReply) => {
      try {
        const forceRefresh = req.query.refresh === 'true';
        const activities = await getActivities(forceRefresh);
        return reply.send(activities);
      } catch (err) {
        fastify.log.error(err, 'Failed to fetch activities');
        return reply.status(500).send({ error: 'Failed to fetch activities from Strava' });
      }
    }
  );

  // GET /activities/summary — returns aggregated metrics
  fastify.get('/activities/summary', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const activities = await getActivities();
      const summary = computeSummary(activities);
      return reply.send(summary);
    } catch (err) {
      fastify.log.error(err, 'Failed to compute summary');
      return reply.status(500).send({ error: 'Failed to compute summary' });
    }
  });

  // POST /activities/cache/invalidate — force cache refresh on next request
  fastify.post('/activities/cache/invalidate', async (_req: FastifyRequest, reply: FastifyReply) => {
    await invalidateCache();
    return reply.send({ message: 'Cache invalidated' });
  });
}
