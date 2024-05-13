import NodeCache from 'node-cache';

// Controllers import
import { ErrorController } from 'src/api/controllers/error';
import { HealthcheckController } from 'src/api/controllers/healthcheck';
import { RootController } from 'src/api/controllers/root';
import { AuthController } from 'src/api/controllers/auth';

// Services import
import { ErrorService } from 'src/services/error-example';
import { AuthService } from 'src/services/auth';
import { NotificationService } from 'src/services/notification';

// Repository import
import { AppDependencies } from './app';
import { AuthRepository } from 'src/repositories/auth';


// clients
import { PrismaClient } from '@prisma/client';
import { MailGunClient } from 'src/client/mailgun';
import { SendGridClient } from 'src/client/sendgrid'
import { connect } from './db-connect';


type InitControllerType = {
    rootController: RootController;
    errorController: ErrorController;
    authController: AuthController;
};

type InitOptionsType = {
    is_app_production: boolean;
};

/**
 * Initialize all ENV values and dependencies here so that they are re-usable across web servers, queue runners and crons
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export async function init(
    deps: AppDependencies = {},
    options: InitOptionsType = {
        is_app_production: false
    }
): Promise<InitControllerType> {
    // in-memory cache
    const appCache = new NodeCache({ stdTTL: 600 });

    // inite prisma
    const prismaClient = new PrismaClient();

    // inite mailgun client
    const mailGunClient = new MailGunClient();
    const sendGridClient = new SendGridClient();
 
    // repositories
    await connect();
    const authRepository = new AuthRepository(prismaClient);

    // services
    const errorService = new ErrorService();
    const authService = new AuthService(authRepository);
    const notificationService = new NotificationService(mailGunClient, sendGridClient);

    // controllers
    const authController = new AuthController(authService, notificationService);
    const rootController = new RootController();
    const errorController = new ErrorController(errorService);

    return {
        rootController,
        errorController,
        authController,
    };
}
