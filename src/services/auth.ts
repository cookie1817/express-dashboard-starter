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
import { UserRepository } from 'src/repositories/user';
import { BusinessRepository } from 'src/repositories/business';
import { InviteStatus, TokenTypes } from 'src/domain/users';
import { JWT_SECRET, JWT_REFRESH_SECRET, DASHBOARD_URL } from 'src/config';
import { generateOtp, checkOtpResendAble } from 'src/helpers/common';

interface JwtPayload {
  userId: string;
  exp: number;
}


export class AuthService {
    private readonly authRepository: AuthRepository;

    private readonly userRepository: UserRepository;

    private readonly businessRepository: BusinessRepository;

    private readonly notificationService: NotificationService;

    constructor(
      authRepository: AuthRepository, 
      userRepository: UserRepository,
      businessRepository: BusinessRepository,
      notificationService: NotificationService
    ) {
        this.authRepository = authRepository;
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.notificationService = notificationService;
    }

    async signIn(email: string, password: string) {

      const id: string = uuid();
      logger.info('auth service api called', id, 'auth.service.ts', '', '', 'signIn-service');
      const user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        throw new StandardError(ErrorCodes.WRONG_EMAIL_AND_PASSWORD, 'Wrong email and password');
      }

      const isPasswordMatched = await bcrypt.compare(password, user?.password);
      if (isPasswordMatched) {
        const tokens = await this.getTokens(user);
        return {
          user,
          ...tokens
        };
      } else {
        throw new StandardError(ErrorCodes.WRONG_EMAIL_AND_PASSWORD, 'Wrong email and password');
      }
    }

    async signUp(name: string, email: string, password: string, businessName: string) {
      const uniqueEmail = await this.userRepository.findUserByEmail(email);
      if (uniqueEmail) {
        throw new StandardError(ErrorCodes.EMAIL_EXISTED, 'User Email existed');
      }


      const uniqueBusinessName = await this.businessRepository.findBusinessByName(businessName);
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
      let user;
      try {
        user = await this.authRepository.createUserAndBusiness(name, email, hashedPassword, businessName, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt)
      } catch(err) {
        console.log('err', err)
      }
    

      if (!user) {
        throw new StandardError(ErrorCodes.CREATED_ACCOUNT_FAILS, 'Creating account fails');
      }

      await this.notificationService.sendOtpCodeEmail(user);
  
      return user;
    }
    
    
    async refreshTokens(userId: string, rt: string) {
      const user = await this.userRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.ACCESS_DENIED, 'Access Denied');
  
      const rtMatches = await bcrypt.compare(rt, user.hashedPassword);
  
      if (!rtMatches) throw new StandardError(ErrorCodes.ACCESS_DENIED, 'Access Denied');
  
      const tokens = await this.getTokens(user);
  
      const rtHash = await this.hashPassword(tokens.refreshToken);
  
      await this.userRepository.updateUserById(user.id, { hashedPassword: rtHash });
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
      const user = await this.userRepository.findOneById(userId);
  
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
      const user = await this.userRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      if (user.isEmailVerify) {
        throw new StandardError(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email is already verfied');
      }

      if (moment().isAfter(moment(user.eamilOtpCodeExpiresAt))) {
        const newOtp = generateOtp();

        const updatedUser = await this.userRepository.updateUserEmailOtpCode(userId, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt);

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
      const user = await this.userRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      if (user.isEmailVerify) {
        throw new StandardError(ErrorCodes.EMAIL_ALREADY_VERIFIED, 'Email is already verfied');
      }

      const canResend = checkOtpResendAble(user.eamilOtpCodeExpiresAt);

      if (canResend) {
        throw new StandardError(ErrorCodes.TOO_MANY_REQUEST, 'Please try it after 30 second');
      }

      const newOtp = generateOtp();

      const updatedUser = await this.userRepository.updateUserEmailOtpCode(userId, newOtp.emailOtpCode, newOtp.eamilOtpCodeExpiresAt);

      // resend email
      await this.notificationService.sendOtpCodeEmail(updatedUser);

      const token = await this.getTokens(updatedUser);

      return token;
    }

    async forgetPassword(email: string, customLang: string) {
      const user = await this.userRepository.findUserByEmail(email);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      if (!user.isEmailVerify) {
        throw new StandardError(ErrorCodes.EMAIL_NOT_VERIFIED, 'Email is not verfied');
      }

      const token = sign({ userId: user.id }, JWT_SECRET, { expiresIn: "4h"});
      const resetUrl = `${DASHBOARD_URL}${customLang}/resetPassword?token=${token}`;
     
      // send email
      await this.notificationService.sendResetPasswordEmail(user, resetUrl);

      return true;
    }

    async resetPassword(password: string, userToken: string) {

      if (!userToken) throw new StandardError(ErrorCodes.TOKEN_NOT_FOUND, 'Authorization token is missing');

      const decoded = verify(userToken, JWT_SECRET) as JwtPayload
      const userId = decoded.userId as string || '';
      const currentTime = Date.now() / 1000;
      const expiredAt = decoded.exp as number;

      const expired = currentTime >= expiredAt;
      if (expired || !userId) throw new StandardError(ErrorCodes.INVALID_TOKEN, 'INVALID_TOKEN');      

      const user = await this.userRepository.findOneById(userId);
  
      if (!user || !user.hashedPassword) throw new StandardError(ErrorCodes.NOT_FOUND, 'User Not Found');

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(
        password,
        saltOrRounds
      );

      // Create the user
      const updatedUser = await this.userRepository.updateUserById(user.id, { hashedPassword: hashedPassword });

      return updatedUser;
    }
}
