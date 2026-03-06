import { Controller, Post, Body, UnauthorizedException, HttpCode, Get } from '@nestjs/common';
import { SubmissionsService } from '../submissions/submissions.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly submissionsService: SubmissionsService) { }

    // In a real app, this should be in an environment variable
    private readonly ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'arena_admin_2026';

    @Post('login')
    @HttpCode(200)
    async login(@Body('password') password: string) {
        if (password !== this.ADMIN_PASSWORD) {
            throw new UnauthorizedException('Invalid admin password');
        }

        // Return a simple "token" for MVP
        return {
            token: 'admin-session-mock-token',
            expiresIn: 3600,
        };
    }

    @Post('recalculate-scores')
    @HttpCode(200)
    async recalculateScores(@Body('password') password: string) {
        if (password !== this.ADMIN_PASSWORD) {
            throw new UnauthorizedException('Invalid admin password');
        }
        return this.submissionsService.recalculateScores();
    }
}
