import { Router, Request, Response, NextFunction } from 'express';
import { StandardError } from 'src/domain/standard-error';
import { logger } from 'src/infra/logger';

interface IErrorService {
    generateError(httpCode: number): [StandardError, string];
}

export class ErrorController {
    private readonly errorService: IErrorService;

    private router: Router;

    public constructor(errorService: IErrorService) {
        this.errorService = errorService;
        this.router = Router();
        this.router.get('/:http_code', this.getError.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    private getError(req: Request, res: Response, next: NextFunction) {
        try {
            const { http_code: httpCode } = req.params;
            logger.info({ httpCode }, 'getError');
            const code = parseInt(httpCode, 10);
            const [err, instructionMsg] = this.errorService.generateError(code);
            if (err) {
                logger.error(err, 'getError error');
                throw err;
            }
            return res.status(200).json({ message: instructionMsg });
        } catch (error) {
            return next(error);
        }
    }
}
