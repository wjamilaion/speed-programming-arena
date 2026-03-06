import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    Req,
    BadRequestException,
    HttpCode,
    Get,
    Query,
    Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '../auth/auth.guard';
import { SubmissionsService } from './submissions.service';

const uploadsDir = process.env.UPLOADS_DIR || './uploads';

@Controller('submissions')
export class SubmissionsController {
    constructor(private readonly submissionsService: SubmissionsService) { }

    @Post()
    @HttpCode(201)
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('solution', {
            storage: diskStorage({
                destination: uploadsDir,
                filename: (_req, _file, cb) => {
                    const uniqueName = `${uuidv4()}.zip`;
                    cb(null, uniqueName);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
            fileFilter: (_req, file, cb) => {
                const ext = extname(file.originalname).toLowerCase();
                if (ext !== '.zip') {
                    return cb(
                        new BadRequestException('Only .zip files are allowed'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body('challengeId') challengeId: string,
        @Body('eventId') eventId: string,
        @Body('startedAt') startedAt: string,
        @Req() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('Solution ZIP file is required');
        }
        if (!challengeId) {
            throw new BadRequestException('challengeId is required');
        }
        if (!startedAt) {
            throw new BadRequestException('startedAt is required');
        }

        const userId = req.user.id;
        return this.submissionsService.create({
            userId,
            challengeId,
            eventId,
            startedAt,
            zipPath: file.path,
        });
    }

    @Get()
    @UseGuards(AuthGuard)
    async findAll(@Req() req: any, @Query('challengeId') challengeId?: string) {
        return this.submissionsService.findAllByUser(req.user.id, challengeId);
    }

    @Get('recent')
    async findRecent(
        @Query('eventId') eventId?: string,
        @Query('challengeId') challengeId?: string,
    ) {
        return this.submissionsService.findRecent(eventId, challengeId);
    }

    @Get('event/:eventId')
    async findAllByEvent(@Param('eventId') eventId: string) {
        return this.submissionsService.findAllByEvent(eventId);
    }
}
