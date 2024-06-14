import { PrismaClient } from '@prisma/client';

export class BusinessRepository {

  private readonly prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findBusinessByName(name: string) {
    return this.prisma.business.findUnique({ where: { name } });
  }

  async createBusiness(name: string) {
    return await this.prisma.business.create({
      data: {
        name,
      },
    });
  }

  async getBusinessById(businessId: string) {
    return this.prisma.business.findUnique({ where: { id: businessId } });
  }

  async getBusinessesByIds(busineeIds: string[]) {
    return this.prisma.business.findMany(
      { where: 
        { id: {
          in: busineeIds
        },
       } 
      }
    );
  }
}