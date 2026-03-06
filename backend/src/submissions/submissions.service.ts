import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Submission } from '../entities/submission.entity';
import { EventsService } from '../events/events.service';

interface CreateSubmissionDto {
    userId: string;
    challengeId: string;
    eventId?: string;
    startedAt: string;
    zipPath: string;
}

@Injectable()
export class SubmissionsService {
    constructor(
        @InjectRepository(Submission)
        private readonly submissionRepo: Repository<Submission>,
        @InjectQueue('evaluation')
        private readonly evaluationQueue: Queue,
        private readonly eventsService: EventsService,
    ) { }

    async create(dto: CreateSubmissionDto) {
        // Rate limit: max 10 submissions per user per challenge
        const count = await this.submissionRepo.count({
            where: {
                user_id: dto.userId,
                challenge_id: dto.challengeId,
            },
        });

        if (count >= 10) {
            throw new BadRequestException(
                'Maximum 10 submissions per challenge reached',
            );
        }

        // Calculate attempt number
        const attemptNumber = count + 1;

        // Calculate time taken
        const startedAt = new Date(dto.startedAt);
        const now = new Date();
        const timeTakenSeconds = Math.floor(
            (now.getTime() - startedAt.getTime()) / 1000,
        );

        // Save submission
        const submission = this.submissionRepo.create({
            user_id: dto.userId,
            challenge_id: dto.challengeId,
            event_id: dto.eventId,
            status: 'queued',
            attempt_number: attemptNumber,
            time_taken_seconds: timeTakenSeconds,
            zip_path: dto.zipPath,
        });

        const saved = await this.submissionRepo.save(submission);

        // Fetch event start time if eventId exists
        let eventStartTime: string | undefined;
        if (dto.eventId) {
            try {
                const event = await this.eventsService.findOne(dto.eventId);
                eventStartTime = event.start_time;
            } catch (e) {
                console.error('Failed to fetch event start time', e);
            }
        }

        // Push to evaluation queue
        await this.evaluationQueue.add('evaluate-submission', {
            submissionId: saved.id,
            userId: dto.userId,
            challengeId: dto.challengeId,
            zipPath: dto.zipPath,
            timeTakenSeconds,
            attemptNumber,
            eventStartTime,
        });

        return { submissionId: saved.id, status: 'queued' };
    }

    async findById(id: string): Promise<Submission | null> {
        return this.submissionRepo.findOne({ where: { id } });
    }

    async updateResult(
        id: string,
        data: {
            status: 'queued' | 'running' | 'accepted' | 'rejected';
            score: number;
            finished_at: Date;
        },
    ) {
        await this.submissionRepo.update(id, data);
    }

    async findAllByUser(userId: string, challengeId?: string) {
        return this.submissionRepo.find({
            where: {
                user_id: userId,
                ...(challengeId ? { challenge_id: challengeId } : {}),
            },
            order: { created_at: 'DESC' },
            take: 10,
        });
    }

    async findRecent(eventId?: string, challengeId?: string) {
        return this.submissionRepo.find({
            where: {
                ...(eventId ? { event_id: eventId } : {}),
                ...(challengeId ? { challenge_id: challengeId } : {}),
            },
            relations: ['user', 'challenge'],
            order: { created_at: 'DESC' },
            take: 20,
        });
    }

    async recalculateScores() {
        // Fetch all accepted submissions with event_id
        const submissions = await this.submissionRepo.find({
            where: { status: 'accepted' },
            relations: ['event'],
        });

        let updatedCount = 0;
        for (const sub of submissions) {
            if (!sub.event || !sub.event.start_time) continue;

            const baseScore = 1000; // Assuming all passed for 'accepted'
            const start = new Date(sub.event.start_time).getTime();
            const created = new Date(sub.created_at).getTime();
            const timeReference = Math.max(0, Math.floor((created - start) / 1000));

            const timeBonus = Math.max(0, 3600 - timeReference);
            const penalty = (sub.attempt_number - 1) * 20;
            const newScore = Math.max(0, Math.round(baseScore + timeBonus - penalty));

            if (sub.score !== newScore) {
                await this.submissionRepo.update(sub.id, { score: newScore });
                updatedCount++;
            }
        }
        return { updatedCount, totalChecked: submissions.length };
    }
}
