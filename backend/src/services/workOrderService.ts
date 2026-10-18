import type { OrderPriority, OrderStatus, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import type { AuthUser } from '../types/auth';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_PARTS', 'COMPLETED'],
  PENDING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface CreateWorkOrderInput {
  customerId: number;
  technicianId?: number | null;
  title: string;
  description: string;
  category: string;
  priority?: OrderPriority;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
}

export interface WorkOrderFilters {
  status?: OrderStatus;
  priority?: OrderPriority;
  technicianId?: number;
  customerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const generateOrderNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await tx.workOrder.count();
  const nextSeq = 1001 + count;
  return `WO-${currentYear}-${nextSeq}`;
};

export const checkTechnicianConflict = async (
  tx: Prisma.TransactionClient,
  technicianId: number,
  start: Date,
  end: Date,
  excludeOrderId?: number
): Promise<void> => {
  const conflictingOrder = await tx.workOrder.findFirst({
    where: {
      technicianId,
      id: excludeOrderId ? { not: excludeOrderId } : undefined,
      status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
      scheduledStart: { not: null },
      scheduledEnd: { not: null },
      AND: [{ scheduledStart: { lt: end } }, { scheduledEnd: { gt: start } }],
    },
    select: {
      orderNumber: true,
      scheduledStart: true,
      scheduledEnd: true,
    },
  });

  if (conflictingOrder) {
    throw new ConflictError(
      `Technician schedule conflict with order ${conflictingOrder.orderNumber} (${conflictingOrder.scheduledStart?.toISOString()} to ${conflictingOrder.scheduledEnd?.toISOString()})`,
      { conflictingOrder }
    );
  }
};

export const createWorkOrder = async (input: CreateWorkOrderInput, currentUser: AuthUser) => {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundError(`Customer #${input.customerId} not found`);
    }

    let initialStatus: OrderStatus = 'DRAFT';
    let schedStart: Date | null = null;
    let schedEnd: Date | null = null;

    if (input.scheduledStart && input.scheduledEnd) {
      schedStart = new Date(input.scheduledStart);
      schedEnd = new Date(input.scheduledEnd);

      if (schedEnd <= schedStart) {
        throw new ValidationError('Scheduled end time must be after scheduled start time');
      }

      if (input.technicianId) {
        const tech = await tx.user.findUnique({
          where: { id: input.technicianId },
        });
        if (!tech?.isActive) {
          throw new ValidationError('Assigned technician does not exist or is inactive');
        }

        await checkTechnicianConflict(tx, input.technicianId, schedStart, schedEnd);
        initialStatus = 'SCHEDULED';
      }
    }

    const orderNumber = await generateOrderNumber(tx);

    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        technicianId: input.technicianId ?? null,
        createdById: currentUser.id,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
        priority: input.priority ?? 'MEDIUM',
        status: initialStatus,
        scheduledStart: schedStart,
        scheduledEnd: schedEnd,
        statusHistory: {
          create: {
            oldStatus: null,
            newStatus: initialStatus,
            changedById: currentUser.id,
            reason: 'Initial work order creation',
          },
        },
      },
      include: {
        customer: true,
        technician: {
          select: { id: true, fullName: true, email: true, phone: true, skillCategories: true },
        },
        items: true,
        statusHistory: {
          include: {
            changedBy: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return workOrder;
  });
};

export const listWorkOrders = async (filters: WorkOrderFilters, currentUser: AuthUser) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.WorkOrderWhereInput = {};

  if (currentUser.role === 'TECHNICIAN') {
    where.technicianId = currentUser.id;
  } else if (filters.technicianId) {
    where.technicianId = filters.technicianId;
  }

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, companyName: true, phone: true } },
        technician: { select: { id: true, fullName: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getWorkOrderById = async (id: number, currentUser: AuthUser) => {
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      technician: {
        select: { id: true, fullName: true, email: true, phone: true, skillCategories: true },
      },
      createdBy: {
        select: { id: true, fullName: true, role: true },
      },
      items: {
        orderBy: { createdAt: 'asc' },
      },
      statusHistory: {
        include: {
          changedBy: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      triageLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Work order #${id} not found`);
  }

  if (currentUser.role === 'TECHNICIAN' && order.technicianId !== currentUser.id) {
    throw new ForbiddenError('You can only access work orders assigned to you');
  }

  return order;
};

export const transitionWorkOrderStatus = async (
  workOrderId: number,
  newStatus: OrderStatus,
  reason: string | undefined,
  currentUser: AuthUser,
  scheduledStart?: string | Date | null,
  scheduledEnd?: string | Date | null,
  technicianId?: number | null
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError(`Work order #${workOrderId} not found`);
    }

    if (currentUser.role === 'TECHNICIAN') {
      if (order.technicianId !== currentUser.id) {
        throw new ForbiddenError('You can only update status for work orders assigned to you');
      }
      const allowedTechStatuses: OrderStatus[] = ['IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED'];
      if (!allowedTechStatuses.includes(newStatus)) {
        throw new ForbiddenError(`Technicians cannot transition orders to status: ${newStatus}`);
      }
    }

    const validNextStatuses = ALLOWED_TRANSITIONS[order.status];
    if (!validNextStatuses.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition: cannot move from ${order.status} to ${newStatus}. Allowed next states: [${validNextStatuses.join(', ')}]`
      );
    }

    const updateData: Prisma.WorkOrderUpdateInput = {
      status: newStatus,
    };

    if (newStatus === 'SCHEDULED') {
      const start = scheduledStart ? new Date(scheduledStart) : order.scheduledStart;
      const end = scheduledEnd ? new Date(scheduledEnd) : order.scheduledEnd;
      const techId = technicianId ?? order.technicianId;

      if (!techId) {
        throw new ValidationError('Technician assignment is required to schedule a work order');
      }
      if (!start || !end) {
        throw new ValidationError('Scheduled start and end times are required');
      }
      if (end <= start) {
        throw new ValidationError('Scheduled end time must be after scheduled start time');
      }

      await checkTechnicianConflict(tx, techId, start, end, order.id);

      updateData.technician = { connect: { id: techId } };
      updateData.scheduledStart = start;
      updateData.scheduledEnd = end;
    }

    if (newStatus === 'IN_PROGRESS') {
      if (!order.actualStart) {
        updateData.actualStart = new Date();
      }
    }

    if (newStatus === 'PENDING_PARTS') {
      if (!reason || reason.trim().length < 3) {
        throw new ValidationError(
          'A detailed reason note is required when marking work order as pending parts'
        );
      }
    }

    if (newStatus === 'CANCELLED') {
      if (!reason || reason.trim().length < 3) {
        throw new ValidationError('A cancellation reason is required');
      }
    }

    if (newStatus === 'COMPLETED') {
      const hasLabor = order.items.some((item) => item.type === 'LABOR');
      if (!hasLabor) {
        throw new ValidationError(
          'Cannot complete a work order without at least one recorded labor item'
        );
      }
      updateData.actualEnd = new Date();
    }

    const updatedOrder = await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        ...updateData,
        statusHistory: {
          create: {
            oldStatus: order.status,
            newStatus,
            changedById: currentUser.id,
            reason: reason ? reason.trim() : null,
          },
        },
      },
      include: {
        customer: true,
        technician: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        items: true,
        statusHistory: {
          include: {
            changedBy: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return updatedOrder;
  });
};
