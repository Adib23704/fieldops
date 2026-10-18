import { ItemType } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { addLineItem, deleteLineItem } from '../services/pricingService';

export const lineItemSchema = z.object({
  type: z.nativeEnum(ItemType),
  description: z.string().min(2, 'Description must be at least 2 characters').max(200),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be zero or positive'),
});

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const validatedData = lineItemSchema.parse(req.body);

    const result = await addLineItem(workOrderId, validatedData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workOrderId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    const result = await deleteLineItem(workOrderId, itemId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
