import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';

describe('Authentication & RBAC Middleware Integration', () => {
  let validPasswordHash: string;
  const mockAdminUser: User = {
    id: 1,
    email: 'admin@fieldops.local',
    passwordHash: '',
    fullName: 'Sarah Jenkins',
    role: 'ADMIN',
    phone: '(512) 555-0199',
    skillCategories: ['HVAC', 'PLUMBING'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTechUser: User = {
    id: 2,
    email: 'tech@fieldops.local',
    passwordHash: '',
    fullName: 'Mike Torres',
    role: 'TECHNICIAN',
    phone: '(512) 555-0177',
    skillCategories: ['HVAC'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash('SecurePassword123!', 10);
    mockAdminUser.passwordHash = validPasswordHash;
    mockTechUser.passwordHash = validPasswordHash;
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 operational status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('operational');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject invalid input payload with 422', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'not-an-email',
        password: '123',
      });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it('should reject nonexistent user with 401', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'unknown@fieldops.local',
        password: 'SecurePassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject wrong password with 401', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockAdminUser);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@fieldops.local',
        password: 'WrongPassword!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should authenticate valid credentials and issue JWT with sanitized user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockAdminUser);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@fieldops.local',
        password: 'SecurePassword123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@fieldops.local');
      expect(response.body.data.user.role).toBe('ADMIN');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should reject request without Authorization header with 401', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid or expired JWT with 401', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return authenticated user profile when valid token provided', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockAdminUser);

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@fieldops.local',
        password: 'SecurePassword123!',
      });

      const token = loginRes.body.data.token;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockAdminUser);

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.email).toBe('admin@fieldops.local');
      expect(meRes.body.data.user.fullName).toBe('Sarah Jenkins');
    });
  });

  describe('RBAC Middleware (requireRole)', () => {
    it('should deny TECHNICIAN access to ADMIN-only endpoint with 403 ForbiddenError', async () => {
      const { requireRole } = await import('../src/middleware/auth');
      const { ForbiddenError } = await import('../src/utils/errors');

      const middleware = requireRole('ADMIN');
      const req = { user: mockTechUser } as unknown as import('express').Request;
      const res = {} as unknown as import('express').Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const passedError = next.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(ForbiddenError);
      expect(passedError.statusCode).toBe(403);
      expect(passedError.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN access to proceed without error', async () => {
      const { requireRole } = await import('../src/middleware/auth');

      const middleware = requireRole('ADMIN');
      const req = { user: mockAdminUser } as unknown as import('express').Request;
      const res = {} as unknown as import('express').Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // No error passed to next()
    });
  });
});
