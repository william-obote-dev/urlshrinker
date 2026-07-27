import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.config.get('REDIS_URL'), {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.client.on('error', (err) => this.logger.error('Redis error', err));
    this.logger.log('Redis connected');
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // Store a short→long URL mapping with optional TTL (seconds)
  async setURL(shortCode: string, longURL: string, ttlSeconds?: number): Promise<void> {
    const key = `url:${shortCode}`;
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, longURL);
    } else {
      await this.client.set(key, longURL);
    }
  }

  // Retrieve the long URL for a short code — this is the HOT path (~2ms)
  async getURL(shortCode: string): Promise<string | null> {
    return this.client.get(`url:${shortCode}`);
  }

  // Delete a URL from cache when it's deleted/expired
  async deleteURL(shortCode: string): Promise<void> {
    await this.client.del(`url:${shortCode}`);
  }

  // Atomic increment for click counter — no DB write needed in real time
  async incrementClicks(shortCode: string): Promise<number> {
    return this.client.incr(`clicks:${shortCode}`);
  }

  // Get cached click count
  async getClicks(shortCode: string): Promise<number> {
    const val = await this.client.get(`clicks:${shortCode}`);
    return val ? parseInt(val) : 0;
  }

  // Sliding window rate limit check
  // Returns { allowed: boolean, remaining: number }
  async checkRateLimit(identifier: string, limit = 100, windowSecs = 60) {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = windowSecs * 1000;

    // Remove old entries outside the window
    await this.client.zremrangebyscore(key, 0, now - windowMs);

    // Count current requests in window
    const count = await this.client.zcard(key);

    if (count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    await this.client.zadd(key, now, `${now}-${Math.random()}`);
    await this.client.expire(key, windowSecs);

    return { allowed: true, remaining: limit - count - 1 };
  }

  // Distributed counter for Base62 ID generation (collision-free)
  async nextId(): Promise<number> {
    return this.client.incr('global:url:counter');
  }
}
