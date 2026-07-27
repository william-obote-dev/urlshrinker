import {
  Injectable, NotFoundException, ConflictException, Logger
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { CacheService } from "../cache/cache.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { CreateUrlDto } from "./dto/create-url.dto";
import * as QRCode from "qrcode";

// Base62 alphabet — 62^6 = 56 billion possible codes
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase62(num: number): string {
  let result = "";
  while (num > 0) {
    result = BASE62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(6, "0");
}

@Injectable()
export class UrlsService {
  private pool: Pool;
  private readonly logger = new Logger(UrlsService.name);

  constructor(
    private cache: CacheService,
    private analytics: AnalyticsService,
    private config: ConfigService,
  ) {
    this.pool = new Pool({
      connectionString: this.config.get("DATABASE_URL"),
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
    this.initDB();
  }

  // Create tables if they do not exist — runs once on startup
  private async initDB() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(30) UNIQUE NOT NULL,
        long_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        total_clicks INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(30) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referer TEXT,
        clicked_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
      CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
    `);
    this.logger.log("Database tables ready");
  }

  async create(dto: CreateUrlDto) {
    let shortCode: string;

    if (dto.customAlias) {
      // Check alias is not taken
      const existing = await this.pool.query(
        "SELECT id FROM urls WHERE short_code = $1",
        [dto.customAlias],
      );
      if (existing.rows.length > 0) {
        throw new ConflictException(`Alias "${dto.customAlias}" is already taken`);
      }
      shortCode = dto.customAlias;
    } else {
      // Get next global counter from Redis, convert to Base62
      // This is collision-free by design — no random, no retry loop
      const counter = await this.cache.nextId();
      shortCode = toBase62(counter);
    }

    const expiresAt = dto.ttlSeconds
      ? new Date(Date.now() + dto.ttlSeconds * 1000)
      : null;

    const result = await this.pool.query(
      `INSERT INTO urls (short_code, long_url, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [shortCode, dto.longUrl, expiresAt],
    );

    // Warm the cache immediately so the first redirect is fast
    await this.cache.setURL(shortCode, dto.longUrl, dto.ttlSeconds);

    const baseUrl = this.config.get("BASE_URL") || "http://localhost:3001";
    const shortUrl = `${baseUrl}/r/${shortCode}`;

    // Generate QR code as base64 PNG
    const qrCode = await QRCode.toDataURL(shortUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    return {
      shortCode,
      shortUrl,
      longUrl: dto.longUrl,
      qrCode,
      expiresAt,
      createdAt: result.rows[0].created_at,
    };
  }

  // THE HOT PATH — this runs on every redirect
  // Redis first (~2ms), PostgreSQL fallback (~20ms)
  async redirect(shortCode: string, req: any) {
    // 1. Check Redis cache first
    let longUrl = await this.cache.getURL(shortCode);

    if (!longUrl) {
      // 2. Cache miss — go to database
      const result = await this.pool.query(
        `SELECT long_url, expires_at, is_active
         FROM urls WHERE short_code = $1`,
        [shortCode],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException("This short link does not exist");
      }

      const row = result.rows[0];

      if (!row.is_active) {
        throw new NotFoundException("This link has been deactivated");
      }

      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        await this.cache.deleteURL(shortCode);
        throw new NotFoundException("This link has expired");
      }

      longUrl = row.long_url;

      // Write-back to cache for next time
      await this.cache.setURL(shortCode, longUrl);
    }

    // 3. Track the click asynchronously — never blocks the redirect
    this.analytics.trackClick({
      shortCode,
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "",
      referer: req.headers["referer"] || "",
    });

    // 4. Increment click counter in Redis
    await this.cache.incrementClicks(shortCode);

    return longUrl;
  }

  async getAll() {
    const result = await this.pool.query(
      `SELECT u.short_code, u.long_url, u.created_at, u.expires_at, u.is_active,
              COALESCE(c.click_count, 0) as total_clicks
       FROM urls u
       LEFT JOIN (
         SELECT short_code, COUNT(*) as click_count FROM clicks GROUP BY short_code
       ) c ON u.short_code = c.short_code
       ORDER BY u.created_at DESC
       LIMIT 50`,
    );
    return result.rows;
  }

  async getOne(shortCode: string) {
    const result = await this.pool.query(
      "SELECT * FROM urls WHERE short_code = $1",
      [shortCode],
    );
    if (result.rows.length === 0) throw new NotFoundException("Link not found");

    const stats = await this.analytics.getClickStats(shortCode);
    const cachedClicks = await this.cache.getClicks(shortCode);

    return { ...result.rows[0], stats, cachedClicks };
  }

  async delete(shortCode: string) {
    await this.pool.query(
      "UPDATE urls SET is_active = false WHERE short_code = $1",
      [shortCode],
    );
    await this.cache.deleteURL(shortCode);
    return { message: "Link deactivated successfully" };
  }

  async getDashboard() {
    return this.analytics.getDashboardStats();
  }
}
