import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

// @Global makes RedisService available everywhere without re-importing
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
