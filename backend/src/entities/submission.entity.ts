import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Challenge } from './challenge.entity';
import { Event } from './event.entity';

@Entity('submissions')
export class Submission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_id', nullable: true })
    event_id: string;

    @ManyToOne(() => Event, (event) => event.submissions)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column('uuid')
    user_id: string;

    @Column('uuid')
    challenge_id: string;

    @Column({ length: 20, default: 'queued' })
    status: 'queued' | 'running' | 'accepted' | 'rejected';

    @Column({ type: 'int', default: 0 })
    score: number;

    @Column({ type: 'int', default: 0 })
    time_taken_seconds: number;

    @Column({ type: 'int', default: 1 })
    attempt_number: number;

    @Column({ length: 500, nullable: true })
    zip_path: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    finished_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Challenge)
    @JoinColumn({ name: 'challenge_id' })
    challenge: Challenge;
}
