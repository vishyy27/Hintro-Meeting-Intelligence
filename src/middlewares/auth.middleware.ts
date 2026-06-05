import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next({ status: 401, code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      userId: string;
      iat?: number;
      exp?: number;
    };
    req.user = decoded;
    next();
  } catch (err) {
    next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
};
