import prisma from '../src/db/prisma';
import { addLineItem, recalculateOrderTotals, roundCurrency } from '../src/services/pricingService';
import { ValidationError } from '../src/utils/errors';

describe('Financial Pricing & Line Items Engine', () => {
  describe('roundCurrency precision', () => {
    it('should round floating point cents accurately to 2 decimal places', () => {
      expect(roundCurrency(12.345)).toBe(12.35);
      expect(roundCurrency(12.344)).toBe(12.34);
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('recalculateOrderTotals', () => {
    it('should calculate accurate subtotal, 8.25% sales tax, and total amount', async () => {
      const mockOrderWithItems = {
        id: 201,
        taxRate: 8.25,
        items: [
          { id: 1, type: 'LABOR', quantity: 2.0, unitPrice: 90.0, totalPrice: 180.0 },
          { id: 2, type: 'PART', quantity: 1.0, unitPrice: 145.5, totalPrice: 145.5 },
          { id: 3, type: 'PART', quantity: 3.0, unitPrice: 12.3, totalPrice: 36.9 },
        ],
      };

      const mockTx = {
        workOrder: {
          findUnique: jest.fn().mockResolvedValue(mockOrderWithItems),
          update: jest.fn().mockResolvedValue({}),
        },
      } as unknown as import('@prisma/client').Prisma.TransactionClient;

      const totals = await recalculateOrderTotals(mockTx, 201);

      expect(totals.subtotal).toBe(362.4);
      expect(totals.taxAmount).toBe(29.9);
      expect(totals.totalAmount).toBe(392.3);

      expect(mockTx.workOrder.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: {
          subtotal: 362.4,
          taxAmount: 29.9,
          totalAmount: 392.3,
        },
      });
    });
  });

  describe('addLineItem constraints', () => {
    it('should reject non-positive quantity with 422 ValidationError', async () => {
      await expect(
        addLineItem(201, {
          type: 'PART',
          description: 'Filter',
          quantity: 0,
          unitPrice: 25.0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject negative unit price with 422 ValidationError', async () => {
      await expect(
        addLineItem(201, {
          type: 'PART',
          description: 'Filter',
          quantity: 1,
          unitPrice: -10.0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should block adding line items to COMPLETED work orders', async () => {
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: (tx: unknown) => unknown) => {
          const tx = {
            workOrder: {
              findUnique: jest.fn().mockResolvedValue({ id: 202, status: 'COMPLETED' }),
            },
          };
          return callback(tx);
        });

      await expect(
        addLineItem(202, {
          type: 'PART',
          description: 'Capacitor',
          quantity: 1,
          unitPrice: 45.0,
        })
      ).rejects.toThrow('Cannot add line items to a work order with status: COMPLETED');
    });
  });
});
