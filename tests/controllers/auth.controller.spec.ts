import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../src/utils/db', () => ({
  __esModule: true,
  default: require('jest-mock-extended').mockDeep(),
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

import { register } from '../../src/controllers/auth.controller';
import prisma from '../../src/utils/db';

const prismaMock = prisma as any;

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = { email: 'test@test.com', password: 'password123', name: 'Test User' };

      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prismaMock.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: 'hashed_password',
        name: 'Test User',
      });
      (jwt.sign as jest.Mock).mockReturnValue('mocked_token');

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        user: { id: 'user-id', email: 'test@test.com' },
        token: 'mocked_token',
      });
    });

    it('should fail if user already exists', async () => {
      mockReq.body = { email: 'existing@test.com', password: 'pwd', name: 'Existing' };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@test.com',
        password: 'pwd',
        name: 'Existing',
      });

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: 'User already exists',
      }));
    });
  });
});
