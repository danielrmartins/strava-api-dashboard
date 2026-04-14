import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { activityRoutes } from './routes/activities.js';
import { athleteRoutes } from './routes/athlete.js';

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function bootstrap(): Promise<void> {
  // CORS — allow requests from the Vite dev server
  await server.register(cors, {
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Routes
  await server.register(authRoutes);
  await server.register(activityRoutes);
  await server.register(athleteRoutes);

  // Health check
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 3001;

  await server.listen({ port, host: '0.0.0.0' });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
