import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get(':challengeId')
    async getTop10(@Param('challengeId') challengeId: string) {
        return this.leaderboardService.getTop10(challengeId);
    }

    @Get(':challengeId/user/:userId')
    async getPersonalChallengeStanding(
        @Param('challengeId') challengeId: string,
        @Param('userId') userId: string,
    ) {
        return this.leaderboardService.getUserChallengeStanding(challengeId, userId);
    }

    @Get('event/:eventId')
    async getEventTop10(@Param('eventId') eventId: string) {
        return this.leaderboardService.getEventTop10(eventId);
    }

    @Get('event/:eventId/user/:userId')
    async getPersonalStanding(
        @Param('eventId') eventId: string,
        @Param('userId') userId: string,
    ) {
        return this.leaderboardService.getUserEventStanding(eventId, userId);
    }
}
