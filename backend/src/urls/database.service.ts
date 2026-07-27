import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    // Neon PostgreSQL — serverless Postgres, free tier 0.5GB
    // ssl required: Neon enforces TLS on all connections
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10, // connection pool size
    });
    await this.initSchema();
    this.logger.log('PostgreSQL (Neon) connected');
  }

  // Runs on startup — idempotent (safe to run multiple times)
  private async initSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id          BIGSERIAL PRIMARY KEY,
        code        VARCHAR(12) UNIQUE NOT NULL,   -- the short code e.g. "x7k2mP"
        long_url    TEXT NOT NULL,                 -- the original URL
        alias       VARCHAR(50),                   -- optional custom alias
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        expires_at  TIMESTAMPTZ,                   -- null = never expires
        clicks      BIGINT DEFAULT 0,              -- denormalised click count
        is_active   BOOLEAN DEFAULT TRUE
      );

      -- Index on code for O(1) lookups on every redirect
      CREATE INDEX IF NOT EXISTS idx_urls_code ON urls(code);

      CREATE TABLE IF NOT EXISTS clicks (
        id          BIGSERIAL PRIMARY KEY,
        url_code    VARCHAR(12) REFERENCES urls(code) ON DELETE CASCADE,
        clicked_at  TIMESTAMPTZ DEFAULT NOW(),
        country     VARCHAR(2),   -- ISO country code from IP
        referrer    TEXT
      );
    `);
  }

  async query(sql: string, params?: any[]) {
    return this.pool.query(sql, params);
  }
}
