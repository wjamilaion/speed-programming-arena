import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsEvents } from './submissions-events.provider';
import { Submission } from '../entities/submission.entity';
import { AuthModule } from '../auth/auth.module';
import { WsModule } from '../ws/ws.module';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([Submission]),
        BullModule.registerQueue({ name: 'evaluation' }),
        forwardRef(() => AuthModule),
        WsModule,
        UsersModule,
        EventsModule,
    ],
    controllers: [SubmissionsController],
    providers: [SubmissionsService, SubmissionsEvents],
    exports: [SubmissionsService],
})
export class SubmissionsModule { }
