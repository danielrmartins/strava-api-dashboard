import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getActivities, computeSummary } from '../services/activityService.js';
import { invalidateCache } from '../services/cacheService.js';

interface ActivitiesQuery {
  refresh?: string;
}

function getSession(req: FastifyRequest): string | null {
  return req.cookies['sid'] ?? null;
}

export async function activityRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: ActivitiesQuery }>(
    '/activities',
    async (req: FastifyRequest<{ Querystring: ActivitiesQuery }>, reply: FastifyReply) => {
      const sid = getSession(req);
      if (!sid) return reply.status(401).send({ error: 'Not authenticated' });

      try {
        const forceRefresh = req.query.refresh === 'true';
        const activities = await getActivities(sid, forceRefresh);
        return reply.send(activities);
      } catch (err) {
        fastify.log.error(err, 'Failed to fetch activities');
        return reply.status(500).send({ error: 'Failed to fetch activities' });
      }
    }
  );

  fastify.get('/activities/summary', async (req: FastifyRequest, reply: FastifyReply) => {
    const sid = getSession(req);
    if (!sid) return reply.status(401).send({ error: 'Not authenticated' });

    try {
      const activities = await getActivities(sid);
      return reply.send(computeSummary(activities));
    } catch (err) {
      fastify.log.error(err, 'Failed to compute summary');
      return reply.status(500).send({ error: 'Failed to compute summary' });
    }
  });

  fastify.post(
    '/activities/cache/invalidate',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const sid = getSession(req);
      if (!sid) return reply.status(401).send({ error: 'Not authenticated' });
      await invalidateCache(sid);
      return reply.send({ message: 'Cache invalidated' });
    }
  );
}
