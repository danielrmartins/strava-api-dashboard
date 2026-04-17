import fs from 'fs/promises';
import path from 'path';

export interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// ─── File-based storage (local development) ──────────────────────────────────

const STORAGE_DIR = path.resolve(process.cwd(), '.storage');

function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

class FileStorage implements IStorage {
  private filePath(key: string): string {
    return path.join(STORAGE_DIR, `${safeKey(key)}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await fs.readFile(this.filePath(key), 'utf-8');
      const { value, expiresAt } = JSON.parse(raw) as { value: T; expiresAt: number | null };
      if (expiresAt !== null && Date.now() > expiresAt) {
        await this.del(key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    await fs.writeFile(this.filePath(key), JSON.stringify({ value, expiresAt }), 'utf-8');
  }

  async del(key: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(key));
    } catch {
      // file didn't exist, nothing to do
    }
  }
}

// ─── Upstash Redis storage (production) ──────────────────────────────────────

class RedisStorage implements IStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  private async getClient(): Promise<any> {
    if (!this.client) {
      const { Redis } = await import('@upstash/redis');
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = await this.getClient();
    return redis.get(key) as Promise<T | null>;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const redis = await this.getClient();
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    const redis = await this.getClient();
    await redis.del(key);
  }
}

// ─── Export the right implementation based on environment ────────────────────

const isProduction = Boolean(process.env.UPSTASH_REDIS_REST_URL);

export const storage: IStorage = isProduction ? new RedisStorage() : new FileStorage();
