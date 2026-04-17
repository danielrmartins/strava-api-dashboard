import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from '../server/src/app.js';

// Singleton — reused across warm invocations
let handler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

async function getHandler() {
  if (!handler) {
    const app = await buildApp();
    await app.ready();
    handler = (req, res) => app.server.emit('request', req, res);
  }
  return handler;
}

export default async function api(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  h(req, res);
}
