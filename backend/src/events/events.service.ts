import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepo: Repository<Event>,
    ) { }

    async findAll() {
        return this.eventRepo.find({
            order: { start_time: 'DESC' },
            relations: ['challenges'],
        });
    }

    async findOne(id: string) {
        const event = await this.eventRepo.findOne({
            where: { id },
            relations: ['challenges'],
        });
        if (!event) throw new NotFoundException('Event not found');
        return event;
    }

    async create(data: Partial<Event>) {
        const event = this.eventRepo.create(data);
        return this.eventRepo.save(event);
    }
}
