import { PrismaClient, User } from '@prisma/client';

export class UserRepository {

  private readonly prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findOneById(userId: string) {
    return await this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateUserById(userId: string, data: Partial<User>) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data
    });
  }

  async updateUserEmailVerificationStatus(userId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerify: true,
      },
    });
  }

  async updateUserEmailOtpCode(userId: string, emailOtpCode: string, eamilOtpCodeExpiresAt: Date) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailOtpCode,
        eamilOtpCodeExpiresAt
      },
    });
  }
}