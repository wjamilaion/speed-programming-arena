import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [UsersModule, forwardRef(() => SubmissionsModule)],
    controllers: [AdminController],
    providers: [AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule { }
