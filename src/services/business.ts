import { ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import { BusinessRepository } from 'src/repositories/business';


export class BusinessService {

    private readonly businessRepository: BusinessRepository;

    constructor(businessRepository: BusinessRepository) {
        this.businessRepository = businessRepository;
    }

    async getBusiness(businessId: string) {
        const businesses = await this.businessRepository.getBusinessById(businessId);
        
        if (!businesses) throw new StandardError(ErrorCodes.NOT_FOUND, 'Business Not Found');
        
        return businesses;
      }

    async getBusinesses(businessIds: string[]) {
      const businesses = await this.businessRepository.getBusinessesByIds(businessIds);
      
      if (!businesses) throw new StandardError(ErrorCodes.NOT_FOUND, 'Business Not Found');
      
      return businesses;
    }
}
