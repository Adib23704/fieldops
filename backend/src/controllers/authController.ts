import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { loginUser } from '../services/authService';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedBody = loginSchema.parse(req.body);
    const result = await loginUser(validatedBody.email, validatedBody.password);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
