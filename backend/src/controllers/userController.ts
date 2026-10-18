import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';

export const createTechnicianSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Valid email address required'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  skillCategories: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateTechnicianSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Valid email address required').optional(),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(30).optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  skillCategories: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const listTechnicians = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';

    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECHNICIAN', 'ADMIN'] },
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        skillCategories: true,
        isActive: true,
        assignedOrders: {
          where: {
            status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            priority: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const formatted = technicians.map((tech) => ({
      id: tech.id,
      fullName: tech.fullName,
      email: tech.email,
      phone: tech.phone,
      role: tech.role,
      skillCategories: tech.skillCategories,
      isActive: tech.isActive,
      activeOrdersCount: tech.assignedOrders.length,
      currentAssignments: tech.assignedOrders,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createTechnicianSchema.parse(req.body);
    const normalizedEmail = validated.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const technician = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: validated.fullName.trim(),
        phone: validated.phone.trim(),
        passwordHash,
        role: 'TECHNICIAN',
        skillCategories: validated.skillCategories,
        isActive: validated.isActive ?? true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        skillCategories: true,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...technician,
        activeOrdersCount: 0,
        currentAssignments: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTechnician = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const validated = updateTechnicianSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError(`Technician #${id} not found`);
    }

    let normalizedEmail: string | undefined;
    if (validated.email && validated.email.toLowerCase().trim() !== existing.email) {
      normalizedEmail = validated.email.toLowerCase().trim();
      const emailInUse = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (emailInUse) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (validated.fullName !== undefined) updateData.fullName = validated.fullName.trim();
    if (normalizedEmail) updateData.email = normalizedEmail;
    if (validated.phone !== undefined) updateData.phone = validated.phone.trim();
    if (validated.skillCategories !== undefined)
      updateData.skillCategories = validated.skillCategories;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.password && validated.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        skillCategories: true,
        isActive: true,
        assignedOrders: {
          where: {
            status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            priority: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...updated,
        activeOrdersCount: updated.assignedOrders.length,
        currentAssignments: updated.assignedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
