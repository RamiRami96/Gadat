import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  errors?: string[];
}

/** One error shape for the whole API: { statusCode, message, errors? }. Never leaks stack traces. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      );
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
        return { statusCode, message: 'Too many requests. Please wait a minute and try again.' };
      }
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string' ? raw : (raw as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return { statusCode, message: 'Validation failed', errors: message };
      }
      return { statusCode, message: message ?? exception.message };
    }
    if (isBodyParserError(exception)) {
      return { statusCode: exception.status, message: 'Invalid request body' };
    }
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}

function isBodyParserError(error: unknown): error is { status: number; type: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'type' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    (error as { status: number }).status >= 400 &&
    (error as { status: number }).status < 500
  );
}
