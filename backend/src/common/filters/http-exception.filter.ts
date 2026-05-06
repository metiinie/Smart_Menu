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
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

    const errorBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'object' && 'message' in (message as object)
          ? (message as { message: string | string[] }).message
          : message,
    };

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : 'No stack trace';
      this.logger.error(`${request.method} ${request.url}\n${stack}`);
      
      // Write to a local file for immediate visibility in this session
      try {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
        const logFile = path.join(logDir, 'backend-errors.log');
        const logEntry = `[${new Date().toISOString()}] ${request.method} ${request.url}\n${stack}\n\n`;
        fs.appendFileSync(logFile, logEntry);
      } catch (e) {
        // Ignore logging failures
      }
    }

    response.status(status).json(errorBody);
  }
}
