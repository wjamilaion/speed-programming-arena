import { OnQueueEvent, QueueEventsHost, QueueEventsListener } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { WsGateway } from '../ws/ws.gateway';
import { UsersService } from '../users/users.service';

@Injectable()
@QueueEventsListener('evaluation')
export class SubmissionsEvents extends QueueEventsHost {
    constructor(
        private readonly wsGateway: WsGateway,
        private readonly usersService: UsersService,
    ) {
        super();
    }

    @OnQueueEvent('completed')
    async onCompleted({ jobId, returnvalue }: { jobId: string; returnvalue: any }) {
        console.log(`Job ${jobId} completed with result:`, returnvalue);
        if (returnvalue && returnvalue.userId) {
            const user = await this.usersService.findById(returnvalue.userId);
            if (user) {
                this.wsGateway.emitSubmissionResult(user.dev_id, {
                    status: returnvalue.status,
                    score: returnvalue.score,
                    time_taken_seconds: returnvalue.timeTakenSeconds,
                    challengeId: returnvalue.challengeId,
                    submissionId: returnvalue.submissionId,
                });
            }
        }
    }

    @OnQueueEvent('active')
    onActive({ jobId }: { jobId: string }) {
        console.log(`Job ${jobId} is now active`);
    }
}
