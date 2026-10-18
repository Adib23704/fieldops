import {
  classifyHeuristic,
  getTriageMetrics,
  matchBestTechnician,
  runTriage,
  type SuggestedTech,
} from '../src/ai/triageEngine';
import prisma from '../src/db/prisma';

interface BenchmarkCase {
  input: string;
  expectedCategory: string;
  expectedUrgency: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const BENCHMARK_DATASET: BenchmarkCase[] = [
  {
    input: 'Commercial walk-in freezer holding at 52F, food spoilage emergency in kitchen.',
    expectedCategory: 'HVAC',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'Central AC stopped cooling, server room ambient temperature rising.',
    expectedCategory: 'HVAC',
    expectedUrgency: 'HIGH',
  },
  {
    input: 'Rooftop condenser unit making loud grinding and vibrating noise.',
    expectedCategory: 'HVAC',
    expectedUrgency: 'MEDIUM',
  },
  {
    input: 'Annual scheduled HVAC maintenance and intake filter replacement.',
    expectedCategory: 'HVAC',
    expectedUrgency: 'LOW',
  },
  {
    input: 'Severe natural gas leak smell near heating furnace in basement.',
    expectedCategory: 'HVAC',
    expectedUrgency: 'EMERGENCY',
  },

  {
    input: 'Burst water pipe in basement utility room, active flooding onto carpet.',
    expectedCategory: 'PLUMBING',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'Main sewer line backup with black water flooding hallway restroom.',
    expectedCategory: 'PLUMBING',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'Kitchen grease trap overflowing and severe water leak under three-bay sink.',
    expectedCategory: 'PLUMBING',
    expectedUrgency: 'HIGH',
  },
  {
    input: 'Low water pressure and slow drain in patient exam room sinks.',
    expectedCategory: 'PLUMBING',
    expectedUrgency: 'MEDIUM',
  },
  {
    input: 'Annual backflow preventer inspection and backflow certification check.',
    expectedCategory: 'PLUMBING',
    expectedUrgency: 'LOW',
  },

  {
    input: 'Electrical breaker panel sparking, smoking and hot to the touch.',
    expectedCategory: 'ELECTRICAL',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'Main distribution breaker arcing with localized smoke and burning smell.',
    expectedCategory: 'ELECTRICAL',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'Sub-panel breaker tripped repeatedly, office lost lighting power.',
    expectedCategory: 'ELECTRICAL',
    expectedUrgency: 'HIGH',
  },
  {
    input: 'Warehouse bay fluorescent lighting ballast humming and flickering.',
    expectedCategory: 'ELECTRICAL',
    expectedUrgency: 'MEDIUM',
  },
  {
    input: 'Routine annual electrical safety inspection of power receptacles.',
    expectedCategory: 'ELECTRICAL',
    expectedUrgency: 'LOW',
  },

  {
    input: 'Commercial oven smelling of raw gas with pilot sparking continuously.',
    expectedCategory: 'APPLIANCE',
    expectedUrgency: 'EMERGENCY',
  },
  {
    input: 'High-temp commercial dishwasher leaking water onto dish pit tile floor.',
    expectedCategory: 'APPLIANCE',
    expectedUrgency: 'HIGH',
  },
  {
    input: 'Bar ice machine bin warm, compressor rattling intermittently.',
    expectedCategory: 'APPLIANCE',
    expectedUrgency: 'MEDIUM',
  },
  {
    input: 'Scheduled routine descaling and maintenance for commercial steamer.',
    expectedCategory: 'APPLIANCE',
    expectedUrgency: 'LOW',
  },
  {
    input: 'Commercial dryer coin slide sticking and tumbling cycle stalling.',
    expectedCategory: 'APPLIANCE',
    expectedUrgency: 'MEDIUM',
  },
];

describe('AI Triage & Decision Benchmark Suite', () => {
  describe('20-Sample Accuracy Benchmark Matrix', () => {
    it('should classify realistic service complaints with >= 90% benchmark accuracy', () => {
      let correctCategory = 0;
      let correctUrgency = 0;

      for (const item of BENCHMARK_DATASET) {
        const result = classifyHeuristic(item.input);
        if (result.predictedCategory === item.expectedCategory) {
          correctCategory++;
        }
        if (result.predictedUrgency === item.expectedUrgency) {
          correctUrgency++;
        }
      }

      const categoryAccuracy = (correctCategory / BENCHMARK_DATASET.length) * 100;
      const urgencyAccuracy = (correctUrgency / BENCHMARK_DATASET.length) * 100;

      expect(categoryAccuracy).toBeGreaterThanOrEqual(90);
      expect(urgencyAccuracy).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Technician Matcher Ranking', () => {
    it('should match technician with relevant skill and lowest active workload', () => {
      const mockTechs: SuggestedTech[] = [
        {
          id: 1,
          fullName: 'Tech A (Busy HVAC)',
          role: 'TECHNICIAN',
          skillCategories: ['HVAC'],
          activeOrdersCount: 4,
        },
        {
          id: 2,
          fullName: 'Tech B (Free HVAC)',
          role: 'TECHNICIAN',
          skillCategories: ['HVAC'],
          activeOrdersCount: 1,
        },
        {
          id: 3,
          fullName: 'Tech C (Plumbing Only)',
          role: 'TECHNICIAN',
          skillCategories: ['PLUMBING'],
          activeOrdersCount: 0,
        },
      ];

      const match = matchBestTechnician(mockTechs, 'HVAC');
      expect(match).not.toBeNull();
      expect(match?.id).toBe(2);
      expect(match?.fullName).toBe('Tech B (Free HVAC)');
    });
  });

  describe('Graceful Fallback & Audit Logging', () => {
    it('should execute heuristic triage and log execution when API key is not configured', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([
        {
          id: 10,
          fullName: 'Alex Rivera',
          role: 'TECHNICIAN',
          skillCategories: ['PLUMBING'],
          assignedOrders: [{ id: 101 }],
        },
      ] as unknown as never);

      jest.spyOn(prisma.aiTriageLog, 'create').mockResolvedValueOnce({
        id: 55,
      } as unknown as never);

      const result = await runTriage({
        description: 'Sewer line overflowing, active flood in basement.',
      });

      expect(result.usedFallback).toBe(true);
      expect(result.predictedUrgency).toBe('EMERGENCY');
      expect(result.predictedCategory).toBe('PLUMBING');
      expect(result.suggestedTechnician?.id).toBe(10);
      expect(result.confidenceScore).toBeGreaterThan(0.7);
    });

    it('should calculate telemetry metrics correctly', async () => {
      jest
        .spyOn(prisma.aiTriageLog, 'count')
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(5); // fallback

      jest.spyOn(prisma.aiTriageLog, 'findMany').mockResolvedValueOnce([
        { predictedUrgency: 'EMERGENCY', dispatcherOverrideUrgency: 'EMERGENCY' },
        { predictedUrgency: 'HIGH', dispatcherOverrideUrgency: 'HIGH' },
        { predictedUrgency: 'MEDIUM', dispatcherOverrideUrgency: 'HIGH' }, // override
      ] as unknown as never);

      const metrics = await getTriageMetrics();

      expect(metrics.totalTriageCount).toBe(20);
      expect(metrics.fallbackFrequency).toBe(25); // 5/20 = 25%
      expect(metrics.humanEvaluatedCount).toBe(3);
      expect(metrics.dispatcherAgreementRate).toBe(67); // 2/3 = 67%
    });
  });
});
