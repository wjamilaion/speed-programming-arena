import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { Submission } from '../entities/submission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Submission])],
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
    exports: [LeaderboardService],
})
export class LeaderboardModule { }
