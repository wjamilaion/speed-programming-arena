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

@Module({
    imports: [
        TypeOrmModule.forFeature([Submission]),
        BullModule.registerQueue({ name: 'evaluation' }),
        AuthModule,
        WsModule,
        UsersModule,
    ],
    controllers: [SubmissionsController],
    providers: [SubmissionsService, SubmissionsEvents],
    exports: [SubmissionsService],
})
export class SubmissionsModule { }
