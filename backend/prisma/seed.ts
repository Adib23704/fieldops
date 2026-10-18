import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma';

export async function runSeed() {
  console.log('[Seed] Seeding database using Prisma...');

  const passwordHash = await bcrypt.hash('AdminPass123!', 10);
  const dispatchHash = await bcrypt.hash('DispatchPass123!', 10);
  const techHash = await bcrypt.hash('TechPass123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@fieldops.local' },
    update: {},
    create: {
      email: 'admin@fieldops.local',
      passwordHash,
      fullName: 'Sarah Jenkins',
      role: 'ADMIN',
      phone: '(512) 555-0199',
      skillCategories: ['HVAC', 'PLUMBING', 'ELECTRICAL'],
      isActive: true,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@fieldops.local' },
    update: {},
    create: {
      email: 'dispatcher@fieldops.local',
      passwordHash: dispatchHash,
      fullName: 'David Miller',
      role: 'DISPATCHER',
      phone: '(512) 555-0144',
      skillCategories: [],
      isActive: true,
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: 'tech.mike@fieldops.local' },
    update: {},
    create: {
      email: 'tech.mike@fieldops.local',
      passwordHash: techHash,
      fullName: 'Mike Torres',
      role: 'TECHNICIAN',
      phone: '(512) 555-0177',
      skillCategories: ['HVAC', 'ELECTRICAL'],
      isActive: true,
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: 'tech.alex@fieldops.local' },
    update: {},
    create: {
      email: 'tech.alex@fieldops.local',
      passwordHash: techHash,
      fullName: 'Alex Rivera',
      role: 'TECHNICIAN',
      phone: '(512) 555-0122',
      skillCategories: ['PLUMBING', 'APPLIANCE'],
      isActive: true,
    },
  });

  const cust1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Marcus Vance',
      companyName: 'Apex Retail Group',
      email: 'operations@apexretail.com',
      phone: '(512) 890-4100',
      address: '10400 Research Blvd, Suite 200',
      city: 'Austin',
      postalCode: '78759',
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Elena Rostova',
      companyName: 'Harbor Bistro & Bar',
      email: 'manager@harborbistro.com',
      phone: '(512) 744-9020',
      address: '3800 Lake Austin Blvd',
      city: 'Austin',
      postalCode: '78703',
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Carl Washington',
      companyName: 'Metro Logistics Center',
      email: 'maintenance@metrologistics.com',
      phone: '(512) 630-1122',
      address: '16200 IH-35 North',
      city: 'Round Rock',
      postalCode: '78681',
    },
  });

  const cust4 = await prisma.customer.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Dr. Aris Thorne',
      companyName: 'Summit Dental Clinic',
      email: 'office@summitdental.com',
      phone: '(512) 450-8833',
      address: '2905 San Gabriel St',
      city: 'Austin',
      postalCode: '78705',
    },
  });

  const existingOrder = await prisma.workOrder.findUnique({
    where: { orderNumber: 'WO-2026-1001' },
  });

  if (!existingOrder) {
    await prisma.workOrder.create({
      data: {
        orderNumber: 'WO-2026-1001',
        customerId: cust1.id,
        technicianId: mike.id,
        createdById: dispatcher.id,
        title: 'Rooftop HVAC Unit Diagnostic & Quarterly Tune-Up',
        description:
          'Unit 3 compressor making grinding noise. Check refrigerant levels, replace primary air intake filters, inspect fan motor bearings.',
        category: 'HVAC',
        status: 'SCHEDULED',
        priority: 'HIGH',
        scheduledStart: new Date(Date.now() + 2 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() + 5 * 3600 * 1000),
        subtotal: 180.0,
        taxRate: 8.25,
        taxAmount: 14.85,
        totalAmount: 194.85,
        items: {
          create: [
            {
              type: 'LABOR',
              description: 'Diagnostic Inspection & Tune-up (hours)',
              quantity: 2.0,
              unitPrice: 90.0,
              totalPrice: 180.0,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: null,
              newStatus: 'DRAFT',
              changedById: dispatcher.id,
              reason: 'Initial customer ticket intake via phone call',
            },
            {
              oldStatus: 'DRAFT',
              newStatus: 'SCHEDULED',
              changedById: dispatcher.id,
              reason: 'Technician Mike Torres assigned for afternoon window',
            },
          ],
        },
      },
    });

    await prisma.workOrder.create({
      data: {
        orderNumber: 'WO-2026-1002',
        customerId: cust2.id,
        technicianId: mike.id,
        createdById: dispatcher.id,
        title: 'Walk-in Freezer Temperature Spike (Food Inventory Hazard)',
        description:
          'Commercial freezer holding at 48F instead of 0F. Condenser fan operational but compressor cycling off prematurely on thermal overload.',
        category: 'HVAC',
        status: 'IN_PROGRESS',
        priority: 'EMERGENCY',
        scheduledStart: new Date(Date.now() - 3600 * 1000),
        scheduledEnd: new Date(Date.now() + 2 * 3600 * 1000),
        actualStart: new Date(Date.now() - 45 * 60 * 1000),
        subtotal: 345.0,
        taxRate: 8.25,
        taxAmount: 28.46,
        totalAmount: 373.46,
        items: {
          create: [
            {
              type: 'LABOR',
              description: 'Emergency Dispatch & Diagnosis',
              quantity: 1.5,
              unitPrice: 110.0,
              totalPrice: 165.0,
            },
            {
              type: 'PART',
              description: 'OEM Thermal Overload Contactor Relay',
              quantity: 1.0,
              unitPrice: 180.0,
              totalPrice: 180.0,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: null,
              newStatus: 'DRAFT',
              changedById: dispatcher.id,
              reason: 'AI Triage classified emergency refrigeration failure',
            },
            {
              oldStatus: 'DRAFT',
              newStatus: 'SCHEDULED',
              changedById: dispatcher.id,
              reason: 'Urgent dispatch to technician nearest restaurant district',
            },
            {
              oldStatus: 'SCHEDULED',
              newStatus: 'DISPATCHED',
              changedById: dispatcher.id,
              reason: 'En route with priority sirens',
            },
            {
              oldStatus: 'DISPATCHED',
              newStatus: 'IN_PROGRESS',
              changedById: mike.id,
              reason: 'Arrived on site, refrigeration gauges connected',
            },
          ],
        },
        triageLogs: {
          create: [
            {
              rawPromptText:
                'Commercial walk-in freezer is holding at 48F instead of 0F. Loud humming, water dripping from evaporator coils onto floor, raw food inventory at risk of total spoilage.',
              predictedUrgency: 'EMERGENCY',
              predictedCategory: 'HVAC',
              confidenceScore: 0.95,
              suggestedTechId: mike.id,
              reasoningSummary:
                'Critical refrigeration thermal failure risking complete restaurant food inventory loss. High urgency dispatch recommended.',
              extractedSymptoms: [
                'temperature spike',
                'water leak',
                'compressor humming',
                'food spoilage hazard',
              ],
              usedFallback: false,
            },
          ],
        },
      },
    });

    await prisma.workOrder.create({
      data: {
        orderNumber: 'WO-2026-1003',
        customerId: cust3.id,
        technicianId: mike.id,
        createdById: dispatcher.id,
        title: 'Main Distribution Sub-Panel Breaker Arcing',
        description:
          'Warehouse bay 4 secondary breaker tripped twice under 150A continuous load. Evidence of localized heat discoloration on busbar.',
        category: 'ELECTRICAL',
        status: 'PENDING_PARTS',
        priority: 'MEDIUM',
        scheduledStart: new Date(Date.now() - 24 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 20 * 3600 * 1000),
        actualStart: new Date(Date.now() - 22 * 3600 * 1000),
        subtotal: 195.0,
        taxRate: 8.25,
        taxAmount: 16.09,
        totalAmount: 211.09,
        items: {
          create: [
            {
              type: 'LABOR',
              description: 'Thermal imaging & electrical fault isolation',
              quantity: 1.5,
              unitPrice: 130.0,
              totalPrice: 195.0,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: 'IN_PROGRESS',
              newStatus: 'PENDING_PARTS',
              changedById: mike.id,
              reason: 'Awaiting warehouse supply delivery for 200A 3-Phase Square D molded breaker',
            },
          ],
        },
      },
    });

    await prisma.workOrder.create({
      data: {
        orderNumber: 'WO-2026-1004',
        customerId: cust4.id,
        technicianId: alex.id,
        createdById: dispatcher.id,
        title: 'Annual Backflow Preventer Testing & Certification',
        description:
          'City mandated annual backflow preventer assembly test for dental suction and autoclave feed lines. Passed differential pressure standards.',
        category: 'PLUMBING',
        status: 'COMPLETED',
        priority: 'LOW',
        scheduledStart: new Date(Date.now() - 72 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 69 * 3600 * 1000),
        actualStart: new Date(Date.now() - 72 * 3600 * 1000),
        actualEnd: new Date(Date.now() - 69.5 * 3600 * 1000),
        subtotal: 225.0,
        taxRate: 8.25,
        taxAmount: 18.56,
        totalAmount: 243.56,
        items: {
          create: [
            {
              type: 'LABOR',
              description: 'Certified Backflow Assembly Inspection & Calibration',
              quantity: 2.0,
              unitPrice: 95.0,
              totalPrice: 190.0,
            },
            {
              type: 'PART',
              description: 'O-ring rebuild kit & test port cock valve',
              quantity: 1.0,
              unitPrice: 35.0,
              totalPrice: 35.0,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              oldStatus: 'IN_PROGRESS',
              newStatus: 'COMPLETED',
              changedById: alex.id,
              reason: 'Inspection passed, tags affixed to riser assembly, report filed',
            },
          ],
        },
      },
    });

    await prisma.workOrder.create({
      data: {
        orderNumber: 'WO-2026-1005',
        customerId: cust2.id,
        createdById: dispatcher.id,
        title: 'High-Temp Commercial Dishwasher Rinse Cycle Stalling',
        description:
          'Dishwasher fails to advance from wash to final sanitize rinse cycle. E-04 error on control board.',
        category: 'APPLIANCE',
        status: 'DRAFT',
        priority: 'MEDIUM',
        subtotal: 0.0,
        taxRate: 8.25,
        taxAmount: 0.0,
        totalAmount: 0.0,
      },
    });
  }

  console.log('[Seed] Prisma seed completed successfully.');
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
