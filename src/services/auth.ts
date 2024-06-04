import { sign, verify } from 'jsonwebtoken';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { User, Token } from '@prisma/client';
import { ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import { logger } from 'src/infra/logger';
import { NotificationService } from 'src/services/notification';
import { AuthRepository } from 'src/repositories/auth';
import { InviteStatus, TokenTypes } from 'src/domain/users';
import { JWT_SECRET, JWT_REFRESH_SECRET } from 'src/config';
import { generateOtp, checkOtpResendAble } from 'src/helpers/common';

export class AuthService {
    private readonly authRepository: AuthRepository;

    private readonly notificationService: NotificationService;

    constructor(authRepository: AuthRepository, notificationService: NotificationService) {
        this.authRepository = authRepository;
        this.notificationService = notificationService;
    }

    async signIn(email: string, password: string) {

      const id: string = uuid();
      logger.info('auth service api called', id, 'auth.service.ts', '', '', 'signIn-service');
      const user = await this.authRepository.findUserByEmail(email);
      if (!user) {
        throw new StandardError(ErrorCodes.WRONG_EMAIL_AND_PASSWORD, 'Wrong email and password');
      }

      const isPasswordMatched = await bcrypt.compare(password, user?.password);
      if (isPasswordMatched) {
        const tokens = await this.getTokens(user);
        return {
          ...tokens
        };
      } else {
        throw new StandardError(ErrorCodes.WRONG_EMAIL_AND_PASSWORD, 'Wrong email and password');
      }
    }

    async signUp(name: string, email: string, password: string, businessName: string) {

      const uniqueEmail = await this.authRepository.findUserByEmail(email);
      if (uniqueEmail) {
        throw new StandardError(ErrorCodes.EMAIL_EXISTED, 'User Email existed');
      }

      const uniqueBusinessName = await this.authRepository.findBusinessByName(businessName);
      if (uniqueBusinessName) {
        throw new StandardError(ErrorCodes.BUSINESS_NAME_EXISTED, 'Business Name existed');
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(
        password,
        saltOrRounds
      );

      const newOtp = generateOtp();
      // Create the user
      const user = await this.authRepository.createUserAndBusiness(name, email, password, hashedPassword, businessName, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt)

      if (!user) {
        throw new StandardError(ErrorCodes.CREATED_ACCOUNT_FAILS, 'Creating account fails');
      }

      await this.notificationService.sendOtpCodeEmail(user);
  
      return user;
    }
    
    
    async refreshTokens(userId: string, rt: string) {
      const user = await this.authRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.ACCESS_DENIED, 'Access Denied');
  
      const rtMatches = await bcrypt.compare(rt, user.hashedPassword);
  
      if (!rtMatches) throw new StandardError(ErrorCodes.ACCESS_DENIED, 'Access Denied');
  
      const tokens = await this.getTokens(user);
  
      const rtHash = await this.hashPassword(tokens.refreshToken);
  
      await this.authRepository.updateUserById(user.id, { hashedPassword: rtHash });
      return tokens;
    }
  
    async getTokens(user: User) {
      const tokenType: string = this.getTokenType(user);
      const at = await sign(
        {
          sub: user.id,
          email: user.email,
          username: user.name,
          isEmailVerified: user.isEmailVerify,
          type: tokenType,
        },
        JWT_SECRET,
        {
          expiresIn: "24h",
        }
      )
      const rt = await sign(
        {
          sub: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerify,
          type: tokenType,
        },
        JWT_REFRESH_SECRET,
        {
          expiresIn: "30d",
        }
      )

      // update token in db
      const tokenData: Partial<Token> = {
        accessToken: at,
        refreshToken: rt,
        type: tokenType,
        expiresAt: moment().add(1, 'day').toDate(),
      }
      await this.authRepository.upsertUserToken(user.id, tokenData)
  
      delete user["password"];

      return {
        accessToken: at,
        refreshToken: rt,
        tokenExpires: moment().add(1, 'day').toDate(),
        user: user
      };
    }

    async getTokensByUserId(userId: string) {
      const user = await this.authRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.ACCESS_DENIED, 'Access Denied');
      
      const token = await this.getTokens(user);

      return token
    }
  
    async hashPassword(data: string) {
      return bcrypt.hash(data, 10);
    }

    getTokenType(user: User): string{
      if (user.inviteStatus === InviteStatus.INVITED || !user.isEmailVerify) {
        return TokenTypes.VERFIY_EMAIL;
      }
      if (user.inviteStatus === InviteStatus.READ_TO_UPDATEPASSWORD) {
        return TokenTypes.RESET_PASSWORD;
      }
      return TokenTypes.VERIFIED;
    }

    verifyRefresh(token: string, userId: string) {
      try {
       const decoded = verify(token, JWT_REFRESH_SECRET);
       return decoded.sub === userId;
      } catch (error) {
       // console.error(error);
       return false;
      }
     }

    async verifiyEmailOtp(userId: string, emailOtpCode: string) {
      const user = await this.authRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      if (user.isEmailVerify) {
        throw new StandardError(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email is already verfied');
      }

      if (moment().isAfter(moment(user.eamilOtpCodeExpiresAt))) {
        const newOtp = generateOtp();

        const updatedUser = await this.authRepository.updateUserEmailOtpCode(userId, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt);

        // resend email
        await this.notificationService.sendOtpCodeEmail(updatedUser);
        throw new StandardError(ErrorCodes.OTP_EXPIRED, 'OTP code expired');
      }

      const matchOtpCode = user.emailOtpCode === emailOtpCode;

      if (!matchOtpCode) {
        throw new StandardError(ErrorCodes.OTP_CODE_NOT_MATCH, 'OTP code not matched');
      }

      const updatedUser = await this.authRepository.updateUserEmailVerificationStatus(userId);


      const token = await this.getTokens(updatedUser);

      return token
    }

    async refreshOtp(userId: string) {
      const user = await this.authRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      if (user.isEmailVerify) {
        throw new StandardError(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email is already verfied');
      }

      const canResend = checkOtpResendAble(user.eamilOtpCodeExpiresAt);

      if (canResend) {
        throw new StandardError(ErrorCodes.TOO_MANY_REQUEST, 'Please try it after 30 second');
      }

      const newOtp = generateOtp();

      const updatedUser = await this.authRepository.updateUserEmailOtpCode(userId, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt);

      // resend email
      await this.notificationService.sendOtpCodeEmail(updatedUser);

      const token = await this.getTokens(updatedUser);

      return token;
    }
}
