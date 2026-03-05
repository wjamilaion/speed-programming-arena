import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
    constructor(private readonly challengesService: ChallengesService) { }

    @Get()
    async findAll(@Query('eventId') eventId?: string) {
        if (eventId) {
            return this.challengesService.findByEvent(eventId);
        }
        return this.challengesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const challenge = await this.challengesService.findById(id);
        if (!challenge) {
            throw new NotFoundException('Challenge not found');
        }
        return challenge;
    }

    @Post()
    async create(@Body() data: any) {
        return this.challengesService.create(data);
    }
}
