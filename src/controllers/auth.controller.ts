import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

/**
 * Registers a new user.
 * Hashes the password and generates a JWT token upon successful registration.
 *
 * @param req - Express request object containing email, password, and name in body.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    // responseInterceptor wraps this into { traceId, success: true, data: ... }
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticates a user and generates a JWT token.
 * Validates the email and password against the database.
 *
 * @param req - Express request object containing email and password in body.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    next(err);
  }
};
