import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS — allow your Netlify frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Auto-validate all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // auto-convert types
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`URLShrinker API running on port ${port}`);
}
bootstrap();
