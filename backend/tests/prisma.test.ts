import prisma from '../src/db/prisma';

describe('Prisma Client & Schema Integrity', () => {
  it('should initialize PrismaClient with all mapped models', () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.customer).toBeDefined();
    expect(prisma.workOrder).toBeDefined();
    expect(prisma.workOrderItem).toBeDefined();
    expect(prisma.workOrderStatusHistory).toBeDefined();
    expect(prisma.aiTriageLog).toBeDefined();
  });

  it('should expose expected query operations for primary models', () => {
    expect(typeof prisma.user.findUnique).toBe('function');
    expect(typeof prisma.workOrder.findMany).toBe('function');
    expect(typeof prisma.workOrder.create).toBe('function');
    expect(typeof prisma.workOrderItem.delete).toBe('function');
    expect(typeof prisma.workOrderStatusHistory.create).toBe('function');
    expect(typeof prisma.aiTriageLog.create).toBe('function');
  });
});
