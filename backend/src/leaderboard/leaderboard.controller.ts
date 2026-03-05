import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get(':challengeId')
    async getTop10(@Param('challengeId') challengeId: string) {
        return this.leaderboardService.getTop10(challengeId);
    }

    @Get('event/:eventId')
    async getEventTop10(@Param('eventId') eventId: string) {
        return this.leaderboardService.getEventTop10(eventId);
    }
}
