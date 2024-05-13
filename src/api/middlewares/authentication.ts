import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { ErrorCodes, ErrorCodeMap } from 'src/domain/errors';
import { JWT_SECRET } from 'src/config';


export const AuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.get("authorization");
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(ErrorCodeMap.TOKEN_NOT_FOUND).json({ error_code: ErrorCodes.TOKEN_NOT_FOUND, message: 'Authorization token is missing' });;
    }
  
    const decoded = verify(token, JWT_SECRET);
    req.body.userId = decoded.sub;
    next();
  } catch (error) {
    return res.status(ErrorCodeMap.INVALID_TOKEN).json({ success: false, msg: error.message });
  }
};
