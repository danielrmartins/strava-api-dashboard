import { storage } from './storageService.js';
import type { Activity } from './activityService.js';

const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes
const cacheKey = (sid: string) => `session:${sid}:activities`;

export async function readCache(sid: string): Promise<Activity[] | null> {
  return storage.get<Activity[]>(cacheKey(sid));
}

export async function writeCache(sid: string, activities: Activity[]): Promise<void> {
  await storage.set(cacheKey(sid), activities, CACHE_TTL_SECONDS);
}

export async function invalidateCache(sid: string): Promise<void> {
  await storage.del(cacheKey(sid));
}
