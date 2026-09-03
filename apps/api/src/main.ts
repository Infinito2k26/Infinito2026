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
  // helmet()'s default Cross-Origin-Resource-Policy: same-origin blocks the
  // browser from loading these in <img> tags from the web app's origin
  // (different port in dev, different domain in prod) — these files are
  // meant to be publicly loadable images, so relax it for this route only.
  app.use(
    '/local-uploads',
    (
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(LOCAL_UPLOAD_DIR),
  );
  // Web app runs on a separate origin/port in dev; refresh-token cookies
  // require an explicit origin (not '*') plus credentials: true.
  // The apex and www hosts are both live, independent origins (no redirect
  // between them), so both must be allowed regardless of which one
  // WEB_ORIGIN names.
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3001';
  const webOriginWwwVariant = webOrigin.includes('://www.')
    ? webOrigin.replace('://www.', '://')
    : webOrigin.replace('://', '://www.');
  app.enableCors({
    origin: [webOrigin, webOriginWwwVariant],
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
