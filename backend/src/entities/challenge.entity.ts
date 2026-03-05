import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('challenges')
export class Challenge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_id', nullable: true })
    event_id: string;

    @ManyToOne(() => Event, (event) => event.challenges)
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @Column({ length: 500 })
    title: string;

    @Column('text')
    description: string;

    @Column({ type: 'int', default: 30 })
    time_limit_minutes: number;

    @Column({ name: 'runner_id', nullable: true })
    runner_id: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
