import type { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma';
import { NotFoundError } from '../utils/errors';

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').max(150),
  companyName: z.string().max(150).optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(30),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required').max(100),
  postalCode: z.string().max(20).optional(),
});

export const listCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = (req.query.search as string)?.trim();
    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { workOrders: true },
        },
      },
    });

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            title: true,
            status: true,
            priority: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer #${id} not found`);
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = customerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name.trim(),
        companyName: validatedData.companyName?.trim() || null,
        email: validatedData.email?.trim() || null,
        phone: validatedData.phone.trim(),
        address: validatedData.address.trim(),
        city: validatedData.city.trim(),
        postalCode: validatedData.postalCode?.trim() || null,
      },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
