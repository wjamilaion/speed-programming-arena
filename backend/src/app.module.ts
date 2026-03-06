import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { ChallengesModule } from './challenges/challenges.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { WsModule } from './ws/ws.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { User } from './entities/user.entity';
import { Challenge } from './entities/challenge.entity';
import { Submission } from './entities/submission.entity';
import { Event } from './entities/event.entity';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            username: process.env.POSTGRES_USER || 'arena',
            password: process.env.POSTGRES_PASSWORD || 'arena_secret_2026',
            database: process.env.POSTGRES_DB || 'arena',
            entities: [User, Challenge, Submission, Event],
            synchronize: true,
        }),
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
        }),
        BullBoardModule.forRoot({
            route: '/admin/queues',
            adapter: ExpressAdapter,
        }),
        BullBoardModule.forFeature({
            name: 'evaluation',
            adapter: BullMQAdapter,
        }),
        AuthModule,
        ChallengesModule,
        SubmissionsModule,
        LeaderboardModule,
        WsModule,
        UsersModule,
        EventsModule,
    ],
})
export class AppModule { }
