import type { UserRole } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  skillCategories: string[];
  isActive: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
