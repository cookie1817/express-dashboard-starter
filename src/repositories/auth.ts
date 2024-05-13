import { PrismaClient, User, Token } from '@prisma/client';
import { RoleCodes, RoleName } from 'src/domain/roles';
import { InviteStatus } from 'src/domain/users';

export class AuthRepository {

  private readonly prisma: PrismaClient;
  
  // constructor(private prisma: PrismaClient) {}
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOneById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findBusinessByName(name: string) {
    return this.prisma.business.findUnique({ where: { name } });
  }

  async createUserAndBusiness(name: string, email: string, password: string, hashedPassword: string, businessName: string, emailCode: string) {
    return this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        hashedPassword,
        inviteStatus: InviteStatus.SIGNUP,
        image: '',
        role: RoleCodes.BUSINESS_OWNER,
        emailCode,
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

  async updateUserById(userId: string, data: Partial<User>) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data
    });
  }

  async upsertUserToken(userId: string, data: Partial<Token>) {
    return this.prisma.token.upsert({
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
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerify: true,
      },
    });
  }

  async createBusiness(name: string) {
    return this.prisma.business.create({
      data: {
        name,
      },
    });
  }
}