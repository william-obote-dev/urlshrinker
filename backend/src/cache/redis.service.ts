import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    // Upstash Redis connects via HTTP — no persistent TCP connection needed
    // This is why it works on serverless platforms
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    this.logger.log('Redis (Upstash) connected');
  }

  // Store a short code → long URL mapping with optional TTL (seconds)
  async setUrl(code: string, longUrl: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(`url:${code}`, longUrl, { ex: ttlSeconds });
    } else {
      await this.client.set(`url:${code}`, longUrl);
    }
  }

  // Look up a long URL by short code (cache-aside: check here before DB)
  async getUrl(code: string): Promise<string | null> {
    return this.client.get<string>(`url:${code}`);
  }

  // Remove a short code from cache (called on deletion)
  async deleteUrl(code: string): Promise<void> {
    await this.client.del(`url:${code}`);
  }

  // Atomic counter: the heart of collision-free ID generation
  // Redis INCR is atomic — even with 100 concurrent requests, each gets a unique number
  async incrementCounter(): Promise<number> {
    return this.client.incr('urlshrinker:global_counter');
  }

  // Increment click count for analytics (non-blocking — caller doesn't await result path)
  async incrementClicks(code: string): Promise<void> {
    await this.client.incr(`clicks:${code}`);
  }

  // Get click count for a short code
  async getClicks(code: string): Promise<number> {
    const val = await this.client.get<number>(`clicks:${code}`);
    return val || 0;
  }

  // Rate limiting: sliding window counter per API key / IP
  async checkRateLimit(identifier: string, maxRequests = 100, windowSeconds = 60): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, windowSeconds); // set TTL on first request
    return count <= maxRequests; // true = allowed, false = blocked
  }
}
