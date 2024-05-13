import { Request, Response, NextFunction } from 'express';
import { API_KEY } from 'src/config';

// copied from @xendit/xendit-utilities;
function APIKeyValidationMiddleware(apiKey: string) {
    // eslint-disable-next-line
    return function (req: Request, res: Response, next: NextFunction) {
        const requestAPIKey = req.get('x-api-key');

        if (requestAPIKey !== apiKey) {
            return res.status(401).send({
                error_code: 'INVALID_API_KEY',
                message: 'Your API key is invalid'
            });
        }

        next();
    };
}

export const authenticationMiddleware = APIKeyValidationMiddleware(API_KEY);
