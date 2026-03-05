import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    async findAll() {
        return this.eventsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.eventsService.create(data);
    }
}
