import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LOCAL_UPLOAD_DIR } from './uploads/uploads.service';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  // Serves UploadsService's local-disk fallback (used when no Cloudinary
  // credentials are configured) — no-op path if that directory is empty.
  app.use('/local-uploads', express.static(LOCAL_UPLOAD_DIR));
  // Web app runs on a separate origin/port in dev; refresh-token cookies
  // require an explicit origin (not '*') plus credentials: true.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
