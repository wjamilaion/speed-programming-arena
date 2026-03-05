import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';
import * as fs from 'fs-extra';
import { evaluateSubmission } from './docker-runner';
import db from './db';

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    'evaluation',
    async (job: Job) => {
        const { submissionId, userId, challengeId, zipPath, timeTakenSeconds, attemptNumber } = job.data;
        console.log(`Processing submission ${submissionId} for user ${userId}`);

        try {
            // 1. Update status to 'running'
            await db.query("UPDATE submissions SET status = 'running' WHERE id = $1", [submissionId]);

            // 2. Evaluate
            const result = await evaluateSubmission({
                submissionId,
                challengeId,
                zipPath,
                timeTakenSeconds,
                attemptNumber,
            });

            // 3. Update DB with result
            await db.query(
                `UPDATE submissions 
         SET status = $1, score = $2, finished_at = NOW() 
         WHERE id = $3`,
                [result.status, result.score, submissionId]
            );

            console.log(`Finished submission ${submissionId}: ${result.status} (Score: ${result.score})`);

            return {
                ...result,
                submissionId,
                userId,
                challengeId,
                timeTakenSeconds,
                attemptNumber,
            };
        } catch (error) {
            console.error(`Error processing submission ${submissionId}:`, error);
            await db.query("UPDATE submissions SET status = 'rejected', finished_at = NOW() WHERE id = $1", [submissionId]);
            throw error;
        }
    },
    { connection: redisConnection }
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

console.log('👷 Worker service started and listening for jobs...');
