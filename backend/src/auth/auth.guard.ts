import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

/**
 * Dynamic auth guard — authenticates based on custom headers.
 * In a real app, this would use JWTs.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const devId = request.headers['x-dev-id'];
        const devName = request.headers['x-dev-name'] || 'Anonymous';
        const devEmail = request.headers['x-dev-email'] || '';

        if (!devId) {
            // For MVP, if no header is present, we'll allow it but it might fail later
            // Better to throw if identification is required
            throw new UnauthorizedException('Developer identification (x-dev-id) is required');
        }

        const user = await this.usersService.findOrCreate(
            devId as string,
            devName as string,
            devEmail as string
        );

        request.user = user;
        return true;
    }
}
