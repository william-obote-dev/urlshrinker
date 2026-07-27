import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class AnalyticsService {
  private pool: Pool;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private config: ConfigService) {
    this.pool = new Pool({
      connectionString: this.config.get('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }

  // Fire-and-forget: never blocks the redirect
  async trackClick(data: {
    shortCode: string;
    ip: string;
    userAgent: string;
    referer: string;
  }): Promise<void> {
    setImmediate(async () => {
      try {
        await this.pool.query(
          `INSERT INTO clicks (short_code, ip_address, user_agent, referer, clicked_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [data.shortCode, data.ip, data.userAgent, data.referer],
        );
      } catch (err) {
        this.logger.error('Click tracking failed silently', err);
      }
    });
  }

  async getClickStats(shortCode: string) {
    const result = await this.pool.query(
      `SELECT COUNT(*) as total_clicks,
              COUNT(DISTINCT ip_address) as unique_visitors,
              DATE_TRUNC('hour', clicked_at) as hour
       FROM clicks
       WHERE short_code = $1
         AND clicked_at > NOW() - INTERVAL '24 hours'
       GROUP BY DATE_TRUNC('hour', clicked_at)
       ORDER BY hour ASC`,
      [shortCode],
    );
    return result.rows;
  }

  async getDashboardStats() {
    const result = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM urls WHERE is_active = true) as total_links,
        (SELECT COUNT(*) FROM clicks) as total_clicks,
        (SELECT COUNT(*) FROM clicks WHERE clicked_at > NOW() - INTERVAL '24 hours') as clicks_today,
        (SELECT COUNT(*) FROM urls WHERE created_at > NOW() - INTERVAL '24 hours') as links_today
    `);
    return result.rows[0];
  }
}
