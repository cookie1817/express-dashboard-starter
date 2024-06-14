import { Router, Request, Response, NextFunction } from 'express';
import { BusinessService } from 'src/services/business';

import { AuthenticateToken } from 'src/api/middlewares/authentication';

export class BusinessController {
    private readonly businessService: BusinessService;

    private router: Router;

    public constructor(businessService: BusinessService) {
        this.businessService = businessService;
        this.router = Router();
        this.router.get('/:businessId', AuthenticateToken, this.getBusiness.bind(this));
        this.router.get('/', AuthenticateToken, this.getBusiness.bind(this));
    }
    getRouter(): Router {
        return this.router;
    }

    async getBusiness(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> {
        try {
            const { businessId } = req.params;

            const result = await this.businessService.getBusiness(businessId)
            return res.status(200).json(result);
        } catch (err) {
            return next(err);
        }
    }

    async getBusinesses(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> {
        try {
            const { businessIds } = req.body;

            const result = await this.businessService.getBusinesses(businessIds)
            return res.status(200).json(result);
        } catch (err) {
            return next(err);
        }
    }
}