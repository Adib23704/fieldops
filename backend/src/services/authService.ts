import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../db/prisma';
import type { AuthUser, JWTPayload } from '../types/auth';
import { UnauthorizedError } from '../utils/errors';

export const sanitizeUser = (user: {
  id: number;
  email: string;
  fullName: string;
  role: AuthUser['role'];
  phone: string | null;
  skillCategories: string[];
  isActive: boolean;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  phone: user.phone,
  skillCategories: user.skillCategories,
  isActive: user.isActive,
});

export const loginUser = async (
  email: string,
  plainPassword: string
): Promise<{ token: string; user: AuthUser }> => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '24h',
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const getUserById = async (id: number): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user?.isActive) {
    throw new UnauthorizedError('User session expired or account deactivated');
  }

  return sanitizeUser(user);
};
