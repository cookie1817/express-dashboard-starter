import { Request, Response, NextFunction } from 'express';
import { INVALID, z, ZodError } from 'zod';
import { ErrorCodes, ErrorCodeMap } from 'src/domain/errors';

export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
      const errorMessages = error.errors.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }))
        res.status(400).json({ error_code: ErrorCodeMap.INVALID_DATA, message: errorMessages });
      } else {
        res.status(500).json({ error_code: ErrorCodeMap.SERVER_ERROR ,message: ErrorCodes.SERVER_ERROR });
      }
    }
  };
}