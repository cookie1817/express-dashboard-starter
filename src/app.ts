import express, { Application, RequestHandler } from 'express';
import cors from 'cors';
import httpContext from 'express-http-context';
import bodyParser from 'body-parser';
import compression from 'compression';
import helmet from 'helmet';
import { errorHandler } from 'src/api/middlewares/handle-error-code';
import { PORT, IS_APP_ENV_PRODUCTION } from 'src/config';
import { logger } from 'src/infra/logger';
import { init } from 'src/init';

export type AppDependencies = {
};

/**
 * Setup the application routes with controllers
 * @param app
 */
async function setupRoutes(app: Application, deps: AppDependencies = {}) {
    const {
        authController,
        userController,
        businessController
    } = await init(deps, {
        is_app_production: IS_APP_ENV_PRODUCTION
    });

    app.use('/api/v1/auth', authController.getRouter());
    app.use('/api/v1/users', userController.getRouter());
    app.use('/api/v1/businesses', businessController.getRouter());
}
const responseErrorHandler = (err: any, data: any) => {
    logger.error(err, { context: data, err: err.message }, 'Error in responseErrorHandler');
};

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3030',
    'http://example.com',
  ];

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
};

/**
 * Main function to setup Express application here
 */
export async function createApp(deps: AppDependencies = {}): Promise<express.Application> {
    const app = express();
    app.disable('x-powered-by');
    app.set('port', PORT);
    app.use(helmet() as RequestHandler);
    app.use(compression());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '5mb', type: 'application/json' }) as RequestHandler);
    app.use(bodyParser.urlencoded({ extended: true }) as RequestHandler);


    // app.use(responseErrorHandler);
   
    // This should be last, right before routes are installed
    // so we can have access to context of all previously installed
    // middlewares inside our routes to be logged
    app.use(httpContext.middleware);


    await setupRoutes(app, deps);

    // In order for errors from async controller methods to be thrown here,
    // you need to catch the errors in the controller and use `next(err)`.
    // See https://expressjs.com/en/guide/error-handling.html
    app.use(errorHandler());

    return app;
}
