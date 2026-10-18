import { OrderPriority } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getTriageMetrics, runTriage } from '../ai/triageEngine';
import prisma from '../db/prisma';
import { NotFoundError } from '../utils/errors';

export const triageRequestSchema = z.object({
  description: z.string().min(5, 'Complaint description must be at least 5 characters').max(2000),
  categoryHint: z.string().optional(),
  workOrderId: z.number().int().positive().optional(),
});

export const evaluateLogSchema = z.object({
  overrideUrgency: z.nativeEnum(OrderPriority),
});

export const executeTriage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = triageRequestSchema.parse(req.body);
    const result = await runTriage(validatedData);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMetrics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await getTriageMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

export const listTriageLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const logs = await prisma.aiTriageLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        suggestedTech: {
          select: { id: true, fullName: true, skillCategories: true },
        },
        workOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    const mappedLogs = logs.map((log) => ({
      ...log,
      inputDescription: log.rawPromptText,
      dispatcherAgreed:
        log.dispatcherOverrideUrgency !== null
          ? log.dispatcherOverrideUrgency === log.predictedUrgency
          : null,
      overrideUrgency: log.dispatcherOverrideUrgency,
    }));

    res.status(200).json({ success: true, data: mappedLogs });
  } catch (error) {
    next(error);
  }
};

export const evaluateTriageLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logId = Number(req.params.id);
    const { overrideUrgency } = evaluateLogSchema.parse(req.body);

    const log = await prisma.aiTriageLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new NotFoundError(`AI triage log #${logId} not found`);
    }

    const updated = await prisma.aiTriageLog.update({
      where: { id: logId },
      data: {
        dispatcherOverrideUrgency: overrideUrgency,
        evaluatedAt: new Date(),
      },
    });

    const mapped = {
      ...updated,
      inputDescription: updated.rawPromptText,
      dispatcherAgreed: overrideUrgency === updated.predictedUrgency,
      overrideUrgency: updated.dispatcherOverrideUrgency,
    };

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};
