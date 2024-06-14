import { sign, verify } from 'jsonwebtoken';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { User, Token } from '@prisma/client';
import { ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import { logger } from 'src/infra/logger';
import { NotificationService } from 'src/services/notification';
import { UserRepository } from 'src/repositories/user';


export class UserService {

    private readonly userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async getUser(userId: string) {
      const user = await this.userRepository.findOneById(userId);
      
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');
      
      return user;
    }
}
