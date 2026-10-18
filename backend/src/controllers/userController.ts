import type { NextFunction, Request, Response } from 'express';
import prisma from '../db/prisma';

export const listTechnicians = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECHNICIAN', 'ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        skillCategories: true,
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
      activeOrdersCount: tech.assignedOrders.length,
      currentAssignments: tech.assignedOrders,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
