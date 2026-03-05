import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../entities/challenge.entity';

@Injectable()
export class ChallengesService {
    constructor(
        @InjectRepository(Challenge)
        private readonly challengeRepo: Repository<Challenge>,
    ) { }

    async findById(id: string): Promise<Challenge | null> {
        return this.challengeRepo.findOne({
            where: { id },
            relations: ['event'],
        });
    }

    async findAll(): Promise<Challenge[]> {
        return this.challengeRepo.find({
            relations: ['event'],
            order: { created_at: 'DESC' },
        });
    }

    async findByEvent(eventId: string): Promise<Challenge[]> {
        return this.challengeRepo.find({
            where: { event_id: eventId },
            order: { created_at: 'ASC' },
        });
    }

    async create(data: Partial<Challenge>): Promise<Challenge> {
        const challenge = this.challengeRepo.create(data);
        return this.challengeRepo.save(challenge);
    }
}
