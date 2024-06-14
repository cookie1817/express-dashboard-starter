import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from 'src/services/user';

import { AuthenticateToken } from 'src/api/middlewares/authentication';

export class UserController {
    private readonly userService: UserService;

    private router: Router;

    public constructor(userService: UserService) {
        this.userService = userService;
        this.router = Router();
        this.router.get('/me', AuthenticateToken, this.getUser.bind(this));
    }
    getRouter(): Router {
        return this.router;
    }

    async getUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> {
        try {
            const { userId } = req.body;

            const result = await this.userService.getUser(userId);
            return res.status(200).json(result);
        } catch (err) {
            return next(err);
        }
    }
}