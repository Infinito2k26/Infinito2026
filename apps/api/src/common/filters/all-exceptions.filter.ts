import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log 500 level errors as webhook alerts
    if (status >= 500) {
      const errorMsg =
        exception instanceof Error
          ? exception.message
          : JSON.stringify(exception);
      const stack = exception instanceof Error ? exception.stack : 'No stack';
      this.logger.error(
        `WEBHOOK_ALERT: Unhandled exception at ${request.method} ${request.url} - ${errorMsg}\nStack: ${stack}`,
      );
    } else {
      // Normal error logging for 400-level
      this.logger.warn(
        `Exception at ${request.method} ${request.url} - Status: ${status}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
