import { PrismaClient, User, Token } from '@prisma/client';
import { RoleCodes, RoleName } from 'src/domain/roles';
import { InviteStatus } from 'src/domain/users';

export class AuthRepository {

  private readonly prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createUserAndBusiness(name: string, email: string, hashedPassword: string, businessName: string, emailOtpCode: string, eamilOtpCodeExpiresAt: Date) {
    return await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        hashedPassword,
        inviteStatus: InviteStatus.SIGNUP,
        image: '',
        role: RoleCodes.BUSINESS_OWNER,
        emailOtpCode,
        eamilOtpCodeExpiresAt,
        isEmailVerify: false,
        businesses: {
          create: {
            name: businessName,
          },
        },
        UserRoles: {
          create: {
            name: RoleName.BUSINESS_OWNER,
            permissions: ['*']
          }
        }
      },
    });
  }

  async upsertUserToken(userId: string, data: Partial<Token>) {
    return await this.prisma.token.upsert({
      where: {
        id: userId,
        userId: userId
      },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        type: data.type,
        expiresAt: data.expiresAt,
      },
      create: {
        id: userId,
        userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        type: data.type,
        expiresAt: data.expiresAt,
      },
    });
  }

  async updateUserEmailVerificationStatus(userId: string) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerify: true,
      },
    });
  }
}