import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Challenge } from './challenge.entity';
import { Submission } from './submission.entity';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ length: 255, nullable: true })
    organized_by: string;

    @Column({ type: 'timestamptz' })
    start_time: Date;

    @Column({ type: 'timestamptz' })
    end_time: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @OneToMany(() => Challenge, (challenge) => challenge.event)
    challenges: Challenge[];

    @OneToMany(() => Submission, (submission) => submission.event)
    submissions: Submission[];
}
