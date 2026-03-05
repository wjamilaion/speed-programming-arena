import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 100, unique: true })
    dev_id: string;

    @Column({ length: 255, nullable: true })
    email: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
