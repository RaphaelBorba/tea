import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;
      const message = res?.message ?? exception.message ?? 'Error';
      const error = res?.error ?? exception.name;
      response.status(status).json({
        statusCode: status,
        error,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const error = (exception as any)?.name ?? 'InternalServerError';
    const message = (exception as any)?.message ?? 'Internal server error';
    const stack = (exception as any)?.stack;

    // Print the error (as requested)
    // eslint-disable-next-line no-console
    console.error(exception);

    response.status(status).json({
      statusCode: status,
      error,
      message,
      stack,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}


