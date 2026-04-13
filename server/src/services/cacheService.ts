import fs from 'fs/promises';
import path from 'path';
import type { Activity } from './activityService.js';

const CACHE_PATH = path.resolve(process.cwd(), 'cache.json');
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface Cache {
  updatedAt: number;
  activities: Activity[];
}

export async function readCache(): Promise<Cache | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as Cache;
  } catch {
    return null;
  }
}

export async function writeCache(activities: Activity[]): Promise<void> {
  const cache: Cache = { updatedAt: Date.now(), activities };
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export function isCacheValid(cache: Cache): boolean {
  return Date.now() - cache.updatedAt < CACHE_TTL_MS;
}

export async function invalidateCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_PATH);
  } catch {
    // file didn't exist, nothing to do
  }
}
