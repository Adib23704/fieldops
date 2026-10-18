import type { ItemType, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface LineItemInput {
  type: ItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const recalculateOrderTotals = async (
  tx: Prisma.TransactionClient,
  workOrderId: number
): Promise<{ subtotal: number; taxAmount: number; totalAmount: number }> => {
  const order = await tx.workOrder.findUnique({
    where: { id: workOrderId },
    include: { items: true },
  });

  if (!order) {
    throw new NotFoundError(`Work order #${workOrderId} not found`);
  }

  let subtotalSum = 0;
  for (const item of order.items) {
    subtotalSum += Number(item.totalPrice);
  }

  const subtotal = roundCurrency(subtotalSum);
  const taxRate = Number(order.taxRate);
  const taxAmount = roundCurrency(subtotal * (taxRate / 100));
  const totalAmount = roundCurrency(subtotal + taxAmount);

  await tx.workOrder.update({
    where: { id: workOrderId },
    data: {
      subtotal,
      taxAmount,
      totalAmount,
    },
  });

  return { subtotal, taxAmount, totalAmount };
};

export const addLineItem = async (workOrderId: number, input: LineItemInput) => {
  if (input.quantity <= 0) {
    throw new ValidationError('Item quantity must be greater than zero');
  }
  if (input.unitPrice < 0) {
    throw new ValidationError('Unit price cannot be negative');
  }

  const totalPrice = roundCurrency(input.quantity * input.unitPrice);

  return prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      select: { status: true },
    });

    if (!order) {
      throw new NotFoundError(`Work order #${workOrderId} not found`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(
        `Cannot add line items to a work order with status: ${order.status}`
      );
    }

    const item = await tx.workOrderItem.create({
      data: {
        workOrderId,
        type: input.type,
        description: input.description.trim(),
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalPrice,
      },
    });

    const updatedTotals = await recalculateOrderTotals(tx, workOrderId);

    return { item, totals: updatedTotals };
  });
};

export const deleteLineItem = async (workOrderId: number, itemId: number) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      select: { status: true },
    });

    if (!order) {
      throw new NotFoundError(`Work order #${workOrderId} not found`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(
        `Cannot remove line items from a work order with status: ${order.status}`
      );
    }

    const item = await tx.workOrderItem.findFirst({
      where: { id: itemId, workOrderId },
    });

    if (!item) {
      throw new NotFoundError(`Item #${itemId} not found on work order #${workOrderId}`);
    }

    await tx.workOrderItem.delete({
      where: { id: itemId },
    });

    const updatedTotals = await recalculateOrderTotals(tx, workOrderId);

    return { deletedItemId: itemId, totals: updatedTotals };
  });
};
