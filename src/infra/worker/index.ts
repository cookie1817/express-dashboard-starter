import '../../module-alias';

import * as http from 'http';
import express, { RequestHandler } from 'express';
import gracefulShutdown from 'http-graceful-shutdown';
import { printMe } from 'src/infra/easter';
import { logger } from 'src/infra/logger';
import { PORT } from 'src/config';

/**
 * Helper function to log an exit code before exiting the process.
 */
export const logAndExitProcess = (exitCode: number): never => {
    logger.info(
        {
            exit_code_number: exitCode
        },
        'Exiting process'
    );
    process.exit(exitCode);
};

/**
 * Sets up event listeners on unexpected errors and warnings. These should theoretically
 * never happen. If they do, we assume that the app is in a bad state. For errors, we
 * exit the process with code 1.
 */
export const setupProcessEventListeners = (): void => {
    process.on('unhandledRejection', (reason: unknown) => {
        logger.warn({ reason_object: reason }, 'encountered unhandled rejection');
        logAndExitProcess(1);
    });

    process.on('uncaughtException', (err: Error) => {
        logger.error(err, 'encountered uncaught exception');
        logAndExitProcess(1);
    });

    process.on('warning', (warning: Error) => {
        logger.warn(
            {
                warning_object: warning
            },
            'encountered warning'
        );
    });
};

export interface GracefulQueueWorkerOptions extends gracefulShutdown.Options {
    readinessHandler?: RequestHandler;
    livenessHandler?: RequestHandler;
    withoutServer?: boolean;
}

export class GracefulQueueWorker {
    private readonly readinessPath = '/healthcheck/readiness';

    private readonly livenessPath = '/healthcheck/liveness';

    protected server?: http.Server;

    protected readinessHandler: RequestHandler = async (req: express.Request, res: express.Response): Promise<void> => {
        res.status(200).send('OK');
    };

    protected livenessHandler: RequestHandler = async (req: express.Request, res: express.Response): Promise<void> => {
        res.status(200).send('OK');
    };

    private readonly defaultGracefulShutdownOptions: gracefulShutdown.Options = {
        timeout: 10000,
        forceExit: true
    };

    constructor(options?: GracefulQueueWorkerOptions) {
        setupProcessEventListeners();

        if (!options?.withoutServer) {
            if (options?.livenessHandler) {
                this.livenessHandler = options.livenessHandler;
            }
            if (options?.readinessHandler) {
                this.readinessHandler = options.readinessHandler;
            }

            this.server = this.runServer();
            gracefulShutdown(this.server, {
                ...this.defaultGracefulShutdownOptions,
                ...options
            });
        }
    }

    runServer(): http.Server {
        const app = express();
        const router = express.Router();
        router.get(this.readinessPath, this.readinessHandler);
        router.get(this.livenessPath, this.livenessHandler);
        app.use(router);

        return app.listen(PORT, () => {
            logger.info(
                {
                    port_number: app.get('port'),
                    env_string: app.get('env')
                },
                printMe
            );
        });
    }
}

export const initGracefulQueueWorker = (options?: GracefulQueueWorkerOptions): GracefulQueueWorker => {
    return new GracefulQueueWorker(options);
};
