import { ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import { UserRepository } from 'src/repositories/user';
import { BusinessRepository } from 'src/repositories/business';


export class UserService {

    private readonly userRepository: UserRepository;

    private readonly businessRepository: BusinessRepository;

    constructor(userRepository: UserRepository, businessRepository: BusinessRepository) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
    }

    async getUser(userId: string) {
      const user = await this.userRepository.findOneById(userId);
      
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      const businesses = await this.businessRepository.getBusinessesByIds(user.businessIDs);
      
      return {...user, businesses};
    }
}
