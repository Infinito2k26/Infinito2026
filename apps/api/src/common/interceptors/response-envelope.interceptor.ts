import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { SuccessResponse } from '../envelope/envelope.types';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse> {
    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true as const,
        data: data ?? null,
        meta: {
          requestId: (req['requestId'] as string) ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
