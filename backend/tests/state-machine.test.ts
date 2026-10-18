import type { OrderStatus } from '@prisma/client';
import prisma from '../src/db/prisma';
import {
  ALLOWED_TRANSITIONS,
  checkTechnicianConflict,
  transitionWorkOrderStatus,
} from '../src/services/workOrderService';
import type { AuthUser } from '../src/types/auth';
import { ConflictError, ValidationError } from '../src/utils/errors';

type TxCallback = (tx: unknown) => unknown;

describe('Work Order State Machine & Conflict Rules', () => {
  const mockDispatcher: AuthUser = {
    id: 1,
    email: 'dispatcher@fieldops.local',
    fullName: 'David Miller',
    role: 'DISPATCHER',
    phone: null,
    skillCategories: [],
    isActive: true,
  };

  const mockTechnician: AuthUser = {
    id: 2,
    email: 'tech@fieldops.local',
    fullName: 'Mike Torres',
    role: 'TECHNICIAN',
    phone: null,
    skillCategories: ['HVAC'],
    isActive: true,
  };

  describe('Transition Matrix Rules', () => {
    it('should strictly allow valid next states from DRAFT', () => {
      expect(ALLOWED_TRANSITIONS.DRAFT).toEqual(['SCHEDULED', 'CANCELLED']);
    });

    it('should strictly allow valid next states from SCHEDULED', () => {
      expect(ALLOWED_TRANSITIONS.SCHEDULED).toEqual(['DISPATCHED', 'CANCELLED']);
    });

    it('should strictly allow valid next states from IN_PROGRESS', () => {
      expect(ALLOWED_TRANSITIONS.IN_PROGRESS).toEqual(['PENDING_PARTS', 'COMPLETED']);
    });

    it('should treat COMPLETED and CANCELLED as terminal states', () => {
      expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
      expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    });
  });

  describe('State Machine Transition Validations', () => {
    it('should reject illegal jump from DRAFT to COMPLETED with 422 ValidationError', async () => {
      const mockOrder = {
        id: 101,
        status: 'DRAFT' as OrderStatus,
        technicianId: 2,
        items: [],
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: TxCallback) => {
        const tx = {
          workOrder: {
            findUnique: jest.fn().mockResolvedValue(mockOrder),
          },
        };
        return callback(tx);
      });

      await expect(
        transitionWorkOrderStatus(101, 'COMPLETED', undefined, mockDispatcher)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject transition to PENDING_PARTS if reason note is missing', async () => {
      const mockOrder = {
        id: 102,
        status: 'IN_PROGRESS' as OrderStatus,
        technicianId: 2,
        items: [{ id: 1, type: 'LABOR' }],
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: TxCallback) => {
        const tx = {
          workOrder: {
            findUnique: jest.fn().mockResolvedValue(mockOrder),
          },
        };
        return callback(tx);
      });

      await expect(
        transitionWorkOrderStatus(102, 'PENDING_PARTS', '  ', mockTechnician)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject transition to COMPLETED if order has zero labor items', async () => {
      const mockOrder = {
        id: 103,
        status: 'IN_PROGRESS' as OrderStatus,
        technicianId: 2,
        items: [{ id: 1, type: 'PART' }],
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: TxCallback) => {
        const tx = {
          workOrder: {
            findUnique: jest.fn().mockResolvedValue(mockOrder),
          },
        };
        return callback(tx);
      });

      await expect(
        transitionWorkOrderStatus(103, 'COMPLETED', 'Done', mockTechnician)
      ).rejects.toThrow('Cannot complete a work order without at least one recorded labor item');
    });

    it('should allow valid transition from IN_PROGRESS to COMPLETED when labor exists', async () => {
      const mockOrder = {
        id: 104,
        status: 'IN_PROGRESS' as OrderStatus,
        technicianId: 2,
        items: [{ id: 1, type: 'LABOR' }],
      };

      const updatedOrderResult = {
        ...mockOrder,
        status: 'COMPLETED' as OrderStatus,
        actualEnd: new Date(),
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: TxCallback) => {
        const tx = {
          workOrder: {
            findUnique: jest.fn().mockResolvedValue(mockOrder),
            update: jest.fn().mockResolvedValue(updatedOrderResult),
          },
        };
        return callback(tx);
      });

      const result = await transitionWorkOrderStatus(
        104,
        'COMPLETED',
        'Finished repair',
        mockTechnician
      );
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Technician Scheduling Conflict Prevention', () => {
    it('should reject overlapping schedule with 409 ConflictError', async () => {
      const mockTx = {
        workOrder: {
          findFirst: jest.fn().mockResolvedValue({
            orderNumber: 'WO-2026-1001',
            scheduledStart: new Date('2026-10-18T14:00:00Z'),
            scheduledEnd: new Date('2026-10-18T17:00:00Z'),
          }),
        },
      } as unknown as import('@prisma/client').Prisma.TransactionClient;

      const newStart = new Date('2026-10-18T15:00:00Z');
      const newEnd = new Date('2026-10-18T18:00:00Z');

      await expect(checkTechnicianConflict(mockTx, 2, newStart, newEnd)).rejects.toThrow(
        ConflictError
      );
    });

    it('should permit non-overlapping schedule without error', async () => {
      const mockTx = {
        workOrder: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as unknown as import('@prisma/client').Prisma.TransactionClient;

      const newStart = new Date('2026-10-18T18:00:00Z');
      const newEnd = new Date('2026-10-18T20:00:00Z');

      await expect(checkTechnicianConflict(mockTx, 2, newStart, newEnd)).resolves.toBeUndefined();
    });
  });
});
