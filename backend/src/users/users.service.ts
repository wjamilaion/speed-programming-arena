import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async findOrCreate(dev_id: string, name: string, email: string) {
        let user = await this.userRepo.findOne({ where: { dev_id } });

        if (!user) {
            user = this.userRepo.create({ dev_id, name, email });
            return this.userRepo.save(user);
        }

        // Update name/email if they changed
        if (user.name !== name || user.email !== email) {
            user.name = name;
            user.email = email;
            return this.userRepo.save(user);
        }

        return user;
    }

    async findById(id: string) {
        return this.userRepo.findOne({ where: { id } });
    }
}
