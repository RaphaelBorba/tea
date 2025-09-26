import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Public health endpoint
    const path: string = request.path || request.originalUrl || '';
    if (path === '/health') return true;

    const userId = request.headers['x-user-id'] as string | undefined;
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('X-User-Id header required');
    }
    return true;
  }
}


