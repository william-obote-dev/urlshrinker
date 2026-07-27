import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UrlsModule } from './urls/urls.module';

@Module({
  imports: [
    // Load .env file everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Global rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    UrlsModule,
  ],
})
export class AppModule {}
