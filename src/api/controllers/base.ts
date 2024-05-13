import { Router } from 'express';

export abstract class BaseController {
    protected router: Router;

    public constructor() {
        this.router = Router();
    }

    getRouter(): Router {
        return this.router;
    }
}
