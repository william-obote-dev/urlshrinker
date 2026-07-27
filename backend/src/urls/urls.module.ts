import { Module } from "@nestjs/common";
import { UrlsController } from "./urls.controller";
import { UrlsService } from "./urls.service";
import { CacheService } from "../cache/cache.service";
import { AnalyticsService } from "../analytics/analytics.service";

@Module({
  controllers: [UrlsController],
  providers: [UrlsService, CacheService, AnalyticsService],
})
export class UrlsModule {}
