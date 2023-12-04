import 'dotenv/config';
import { Redis } from 'ioredis';

const REDIS_URI = process.env.REDIS_URI || '';

export class RedisClient {
  static instance: RedisClient;
  private client: Redis;

  constructor() {
    this.client = new Redis(REDIS_URI, {
      connectTimeout: 30_000,
    });

    this.client.on('connect', () => {});

    this.client.on('error', (error) => {
      console.log('Redis client meets error: %s', error?.stack);
      process.exit(1);
    });
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) RedisClient.instance = new RedisClient();
    return RedisClient.instance;
  }

  public async get<T = any>(key: string): Promise<T> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  public async set<T = any>(
    key: string,
    value: T,
    ttl: number = 24 * 60 * 60,
  ): Promise<boolean> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  }

  public async release(): Promise<void> {
    await this.client.quit();
  }
}
