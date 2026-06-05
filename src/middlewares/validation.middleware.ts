import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        });
      }
      next(error);
    }
  };
};
