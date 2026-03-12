import type { DedupBackend, DedupConfig } from "./types.js";

export interface RedisClient {
  exists(key: string): Promise<number>;
  setex(key: string, ttlSeconds: number, value: string): Promise<void>;
}

export interface DatabaseClient {
  webhookDedup: {
    findUnique: (args: { where: { key: string }; select: { expiresAt: true } }) => Promise<{ expiresAt: Date } | null>;
    delete: (args: { where: { key: string } }) => Promise<void>;
    upsert: (args: { where: { key: string }; update: { expiresAt: Date }; create: { key: string; expiresAt: Date } }) => Promise<void>;
  };
}

export class InMemoryDedupBackend implements DedupBackend {
  private seen = new Map<string, number>();

  constructor(private ttlMs: number = 3_600_000) {}

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.seen) {
      if (now - timestamp > this.ttlMs) this.seen.delete(key);
    }
  }

  async isDuplicate(key: string): Promise<boolean> {
    this.cleanup();
    return this.seen.has(key);
  }

  async markDuplicate(key: string, _ttlMs: number): Promise<void> {
    this.seen.set(key, Date.now());
  }
}

export class RedisDedupBackend implements DedupBackend {
  private redis: RedisClient;

  constructor(redisClient: RedisClient, private defaultTtlMs: number = 3_600_000) {
    this.redis = redisClient;
  }

  async isDuplicate(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async markDuplicate(key: string, ttlMs: number): Promise<void> {
    const ttlSeconds = Math.ceil((ttlMs || this.defaultTtlMs) / 1000);
    await this.redis.setex(key, ttlSeconds, "1");
  }
}

export class DatabaseDedupBackend implements DedupBackend {
  private db: DatabaseClient;

  constructor(databaseClient: DatabaseClient, private defaultTtlMs: number = 3_600_000) {
    this.db = databaseClient;
  }

  async isDuplicate(key: string): Promise<boolean> {
    const record = await this.db.webhookDedup.findUnique({
      where: { key },
      select: { expiresAt: true }
    });

    if (!record) return false;

    if (new Date() > record.expiresAt) {
      await this.db.webhookDedup.delete({ where: { key } });
      return false;
    }

    return true;
  }

  async markDuplicate(key: string, ttlMs: number): Promise<void> {
    const ttl = ttlMs || this.defaultTtlMs;
    const expiresAt = new Date(Date.now() + ttl);

    await this.db.webhookDedup.upsert({
      where: { key },
      update: { expiresAt },
      create: { key, expiresAt }
    });
  }
}

export function createDedupBackend(config?: DedupConfig): DedupBackend {
  if (config?.backend) {
    return config.backend;
  }

  return new InMemoryDedupBackend(config?.ttlMs);
}