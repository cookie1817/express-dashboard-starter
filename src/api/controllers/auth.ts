import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuid } from "uuid";

import { logger } from 'src/infra/logger';
import { AuthService } from 'src/services/auth';
import { NotificationService } from 'src/services/notification';

import { validateData } from 'src/api/middlewares/request-payload-validation';
import { AuthenticateToken } from 'src/api/middlewares/authentication';
import { 
    userSignInDto,
    userSignUpDto,
} from 'src/api/dto/auth';

import { DASHBOARD_URL } from 'src/config';
import { ErrorCodeMap, ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';


export class AuthController {
    private readonly authService: AuthService;

    private readonly notificationService: NotificationService;

    private router: Router;

    public constructor(authService: AuthService, notificationService: NotificationService) {
        this.authService = authService;
        this.notificationService = notificationService;
        this.router = Router();
        this.router.post('/signin', validateData(userSignInDto), this.signIn.bind(this));
        this.router.post('/signup', validateData(userSignUpDto), this.signUp.bind(this));
        this.router.post('/singout', AuthenticateToken, this.signOut.bind(this));
        this.router.post('/refresh', AuthenticateToken, this.refreshToken.bind(this));
        this.router.get('/verfifyEmail/:userId', this.verfifyEmail.bind(this));
        this.router.get('/vuser', AuthenticateToken, this.getUser.bind(this));
    }

    // todo:
        // flow 2: invited -> generate email code and save in db -> send mail

    getRouter(): Router {
        return this.router;
    }

    async signIn(req: Request, res: Response, next: NextFunction) {
        try {
            const id: string = uuid();
            logger.info(
                "User login api called",
                id,
                "auth.controler.ts",
                "POST",
                "/login",
                "signIn"
              );
            const { email, password } = req.body;
            const token = await this.authService.signIn(email, password);

            res.cookie("accessToken", token.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
              });
          
              res.cookie("refreshToken", token.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
              });

            return res.status(200).json(token);
        } catch (error) {
            return next(error);
        }
    }

    async signUp(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password, business_name: businessName } = req.body;
            const user = await this.authService.signUp(name, email, password, businessName);
            const token = await this.authService.getTokens(user);

            await this.notificationService.sendVerificationEmail(user);
            
            return res.status(201).json(token);
        } catch (error) {
            return next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken, userId } = req.body;

            const isValid = this.authService.verifyRefresh(refreshToken, userId);
            if (!isValid) return res.status(ErrorCodeMap.INVALID_TOKEN).json({ success: false, error: "Invalid token,try login again" });

            const token = await this.authService.getTokensByUserId(userId);
            const id: string = uuid();
            logger.info(
            "User refresh api called",
            id,
            "auth.controler.ts",
            "POST",
            "/refresh",
            "refreshTokens"
            );
            res.cookie("accessToken", token.accessToken, {
            httpOnly: true,
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            path: "/",
            secure: true,
            });

            res.cookie("refreshToken", token.refreshToken, {
            httpOnly: true,
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            path: "/",

            secure: true,
            });
            return res.status(201).json(token);
        } catch (error) {
            return next(error);
        }
    }

    async signOut(req: Request, res: Response, next: NextFunction) {
        try {
            const id: string = uuid();
            logger.info(
                "User logout api called",
                id,
                "auth.controler.ts",
                "POST",
                "/logout",
                "logout"
              );
          
              res.clearCookie("accessToken");
              res.clearCookie("refreshToken");
              res.clearCookie("uid");
            return res.status(201).json({ message: "ok" });
        } catch (error) {
            return next(error);
        }
    }

    async verfifyEmail(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> {
        try {
            const { userId } = req.params;

            const result = await this.authService.verifiyEmail(userId, req.query.email_code as string);
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                path: "/",
                secure: true,
                });
    
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                path: "/",
    
                secure: true,
            });
            return res.redirect(DASHBOARD_URL);
        } catch (err) {
            return next(err);
        }
    }

    async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken, userId } = req.body;

            const isValid = this.authService.verifyRefresh(refreshToken, userId);
            if (!isValid) return res.status(ErrorCodeMap.INVALID_TOKEN).json({ success: false, error: "Invalid token,try login again" });

            const token = await this.authService.getTokensByUserId(userId);
            const id: string = uuid();
            logger.info(
            "User refresh api called",
            id,
            "auth.controler.ts",
            "POST",
            "/refresh",
            "refreshTokens"
            );
            res.cookie("accessToken", token.accessToken, {
            httpOnly: true,
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            path: "/",
            secure: true,
            });

            res.cookie("refreshToken", token.refreshToken, {
            httpOnly: true,
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            path: "/",

            secure: true,
            });
            return res.status(201).json(token);
        } catch (error) {
            return next(error);
        }
    }
}