import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [AdminController],
    providers: [AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule { }
