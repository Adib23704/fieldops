import { OrderPriority, OrderStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  createWorkOrder,
  getWorkOrderById,
  listWorkOrders,
  transitionWorkOrderStatus,
} from '../services/workOrderService';
import { UnauthorizedError } from '../utils/errors';

export const createWorkOrderSchema = z.object({
  customerId: z.number().int().positive('Valid customer ID is required'),
  technicianId: z.number().int().positive().nullable().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(2, 'Category is required').max(50),
  priority: z.nativeEnum(OrderPriority).optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
});

export const transitionStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().optional(),
  technicianId: z.number().int().positive().nullable().optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
});

export const listOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const filters = {
      status: req.query.status as OrderStatus | undefined,
      priority: req.query.priority as OrderPriority | undefined,
      technicianId: req.query.technicianId ? Number(req.query.technicianId) : undefined,
      customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const result = await listWorkOrders(filters, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const id = Number(req.params.id);
    const order = await getWorkOrderById(id, req.user);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const validatedData = createWorkOrderSchema.parse(req.body);
    const workOrder = await createWorkOrder(validatedData, req.user);
    res.status(201).json({ success: true, data: workOrder });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const id = Number(req.params.id);
    const validatedData = transitionStatusSchema.parse(req.body);

    const updated = await transitionWorkOrderStatus(
      id,
      validatedData.status,
      validatedData.reason,
      req.user,
      validatedData.scheduledStart,
      validatedData.scheduledEnd,
      validatedData.technicianId
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
