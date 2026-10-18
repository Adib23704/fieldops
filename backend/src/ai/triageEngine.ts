import { type OrderPriority, Prisma } from '@prisma/client';
import { config } from '../config';
import prisma from '../db/prisma';
import { logger } from '../utils/logger';

export interface TriageInput {
  description: string;
  categoryHint?: string;
  workOrderId?: number;
}

export interface SuggestedTech {
  id: number;
  fullName: string;
  role: string;
  skillCategories: string[];
  activeOrdersCount: number;
}

export interface TriageResult {
  triageLogId?: number;
  predictedUrgency: OrderPriority;
  predictedCategory: string;
  confidenceScore: number;
  extractedSymptoms: string[];
  reasoningSummary: string;
  suggestedTechnician: SuggestedTech | null;
  usedFallback: boolean;
}

const PRIORITY_KEYWORDS: Record<OrderPriority, { words: string[]; weight: number }> = {
  EMERGENCY: {
    words: [
      'gas leak',
      'smell gas',
      'raw gas',
      'fire',
      'smoke',
      'smoking',
      'sparking',
      'sparks',
      'flood',
      'flooding',
      'freezer warm',
      'freezer warming',
      'food spoilage',
      'high temp alarm',
      'burst pipe',
      'explosion',
      'toxic',
      'chemical smell',
      'carbon monoxide',
    ],
    weight: 1.0,
  },
  HIGH: {
    words: [
      'no heat',
      'no ac',
      'no cooling',
      'stopped cooling',
      'cooling stopped',
      'temperature rising',
      'ambient temperature rising',
      'water leak',
      'leaking water',
      'tripped breaker',
      'breaker tripped',
      'breaker arcing',
      'arcing',
      'server room hot',
      'compressor clicking',
      'overflowing',
      'drain backup',
      'no power',
      'lost power',
      'lost lighting power',
      'short circuit',
      'refrigerant smell',
    ],
    weight: 0.85,
  },
  MEDIUM: {
    words: [
      'noisy',
      'grinding',
      'vibrating',
      'slow drain',
      'low pressure',
      'intermittent',
      'stalling',
      'dishwasher error',
      'burner clicks',
      'whistling',
      'rattling',
      'humming',
      'flickering',
    ],
    weight: 0.75,
  },
  LOW: {
    words: [
      'inspection',
      'annual',
      'routine',
      'tune-up',
      'filter check',
      'replace filter',
      'maintenance',
      'cosmetic',
      'loose knob',
      'certification',
      'checkup',
      'descaling',
    ],
    weight: 0.8,
  },
};

const EQUIPMENT_NOUNS: Record<string, string[]> = {
  APPLIANCE: [
    'dishwasher',
    'oven',
    'stove',
    'range',
    'washer',
    'dryer',
    'ice machine',
    'steamer',
    'commercial steamer',
    'garbage disposal',
    'hood',
  ],
  HVAC: [
    'hvac',
    'furnace',
    'boiler',
    'freezer',
    'walk-in',
    'condenser',
    'evaporator',
    'thermostat',
    'chiller',
    'compressor',
  ],
  PLUMBING: [
    'sewer',
    'toilet',
    'faucet',
    'backflow',
    'water heater',
    'grease trap',
    'pipe',
    'pipes',
    'sink',
    'plumbing',
    'drain',
  ],
  ELECTRICAL: [
    'breaker',
    'panel',
    'sub-panel',
    'ballast',
    'lighting',
    'outlet',
    'transformer',
    'wiring',
    'fuse',
    'receptacles',
  ],
};

const SECONDARY_KEYWORDS: Record<string, string[]> = {
  HVAC: [
    'cooling',
    'heating',
    'heat',
    'coolant',
    'refrigerant',
    'air intake',
    'duct',
    'air conditioning',
  ],
  PLUMBING: ['water', 'leak', 'flood', 'flooding', 'clogged', 'valve', 'pressure'],
  ELECTRICAL: [
    'electrical',
    'power',
    'sparks',
    'sparking',
    'voltage',
    'short circuit',
    'arcing',
    'flickering',
  ],
  APPLIANCE: ['appliance', 'descaling', 'dish pit', 'coin slide', 'tumbling cycle'],
};

export const containsWord = (text: string, term: string): boolean => {
  if (term.length <= 3) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(term.toLowerCase());
};

export const classifyHeuristic = (
  text: string,
  categoryHint?: string
): {
  predictedUrgency: OrderPriority;
  predictedCategory: string;
  confidenceScore: number;
  extractedSymptoms: string[];
  reasoningSummary: string;
} => {
  const lower = text.toLowerCase();
  const symptoms: string[] = [];

  let predictedUrgency: OrderPriority = 'MEDIUM';
  let bestUrgencyWeight = 0.5;

  for (const [prio, cfg] of Object.entries(PRIORITY_KEYWORDS) as [
    OrderPriority,
    (typeof PRIORITY_KEYWORDS)[OrderPriority],
  ][]) {
    for (const keyword of cfg.words) {
      if (containsWord(lower, keyword)) {
        symptoms.push(keyword);
        if (cfg.weight > bestUrgencyWeight) {
          predictedUrgency = prio;
          bestUrgencyWeight = cfg.weight;
        }
      }
    }
  }

  const categoryScores: Record<string, number> = {
    HVAC: 0,
    PLUMBING: 0,
    ELECTRICAL: 0,
    APPLIANCE: 0,
  };

  for (const [cat, words] of Object.entries(EQUIPMENT_NOUNS)) {
    for (const w of words) {
      if (containsWord(lower, w)) {
        categoryScores[cat] = (categoryScores[cat] || 0) + 3.0;
      }
    }
  }

  for (const [cat, words] of Object.entries(SECONDARY_KEYWORDS)) {
    for (const w of words) {
      if (containsWord(lower, w)) {
        categoryScores[cat] = (categoryScores[cat] || 0) + 1.0;
      }
    }
  }

  if (categoryHint && categoryScores[categoryHint.toUpperCase()] !== undefined) {
    categoryScores[categoryHint.toUpperCase()] += 2.0;
  }

  let predictedCategory = 'HVAC';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > highestScore) {
      highestScore = score;
      predictedCategory = cat;
    }
  }

  if (symptoms.length === 0) {
    symptoms.push('general operational inquiry');
  }

  const uniqueSymptoms = Array.from(new Set(symptoms)).slice(0, 5);

  let confidenceScore = Math.min(0.95, 0.65 + uniqueSymptoms.length * 0.08);
  if (lower.length < 15) {
    confidenceScore = 0.45;
  }

  let reasoningSummary = `Assigned ${predictedUrgency} urgency for ${predictedCategory} equipment based on key indicators: ${uniqueSymptoms.join(', ')}.`;
  if (predictedUrgency === 'EMERGENCY') {
    reasoningSummary = `High-hazard indicators detected (${uniqueSymptoms.join(', ')}). Immediate technician dispatch required to mitigate safety and property risk.`;
  }

  return {
    predictedUrgency,
    predictedCategory,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    extractedSymptoms: uniqueSymptoms,
    reasoningSummary,
  };
};

export const matchBestTechnician = (
  availableTechs: SuggestedTech[],
  predictedCategory: string
): SuggestedTech | null => {
  if (!availableTechs.length) {
    return null;
  }

  const matchingTechs = availableTechs.filter((tech) =>
    tech.skillCategories.includes(predictedCategory)
  );

  const candidatePool = matchingTechs.length ? matchingTechs : availableTechs;

  return candidatePool.slice().sort((a, b) => a.activeOrdersCount - b.activeOrdersCount)[0] ?? null;
};

export const runTriage = async (input: TriageInput): Promise<TriageResult> => {
  const rawTechs = await prisma.user.findMany({
    where: {
      role: { in: ['TECHNICIAN', 'ADMIN'] },
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      role: true,
      skillCategories: true,
      assignedOrders: {
        where: {
          status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
        },
        select: { id: true },
      },
    },
  });

  const availableTechs: SuggestedTech[] = rawTechs.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    role: t.role,
    skillCategories: t.skillCategories,
    activeOrdersCount: t.assignedOrders.length,
  }));

  let triageData = {
    predictedUrgency: 'MEDIUM' as OrderPriority,
    predictedCategory: 'HVAC',
    confidenceScore: 0.75,
    extractedSymptoms: ['operational check'],
    reasoningSummary: 'Standard ticket triage evaluation.',
    usedFallback: true,
  };

  if (config.AI_API_KEY && config.AI_API_KEY.trim().length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const prompt = `You are a field service dispatch triage assistant. Classify the customer complaint text into JSON:
{
  "predictedUrgency": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "predictedCategory": "HVAC" | "PLUMBING" | "ELECTRICAL" | "APPLIANCE",
  "confidenceScore": number (0.0 to 1.0),
  "extractedSymptoms": string[],
  "reasoningSummary": string
}
Input text: "${input.description}"`;

      const response = await fetch(config.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.AI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          triageData = {
            predictedUrgency: parsed.predictedUrgency || 'MEDIUM',
            predictedCategory: parsed.predictedCategory || 'HVAC',
            confidenceScore: Number(parsed.confidenceScore) || 0.85,
            extractedSymptoms: Array.isArray(parsed.extractedSymptoms)
              ? parsed.extractedSymptoms
              : [],
            reasoningSummary: parsed.reasoningSummary || 'AI model classified complaint.',
            usedFallback: false,
          };
        }
      }
    } catch (err) {
      logger.warn(
        'AI API call failed or timed out. Gracefully activating heuristic fallback.',
        err
      );
      triageData = {
        ...classifyHeuristic(input.description, input.categoryHint),
        usedFallback: true,
      };
    }
  } else {
    triageData = {
      ...classifyHeuristic(input.description, input.categoryHint),
      usedFallback: true,
    };
  }

  const suggestedTechnician = matchBestTechnician(availableTechs, triageData.predictedCategory);

  const triageLog = await prisma.aiTriageLog.create({
    data: {
      workOrderId: input.workOrderId ?? null,
      rawPromptText: input.description.trim(),
      predictedUrgency: triageData.predictedUrgency,
      predictedCategory: triageData.predictedCategory,
      confidenceScore: new Prisma.Decimal(triageData.confidenceScore),
      suggestedTechId: suggestedTechnician ? suggestedTechnician.id : null,
      reasoningSummary: triageData.reasoningSummary,
      extractedSymptoms: triageData.extractedSymptoms,
      usedFallback: triageData.usedFallback,
    },
  });

  return {
    triageLogId: triageLog.id,
    predictedUrgency: triageData.predictedUrgency,
    predictedCategory: triageData.predictedCategory,
    confidenceScore: triageData.confidenceScore,
    extractedSymptoms: triageData.extractedSymptoms,
    reasoningSummary: triageData.reasoningSummary,
    suggestedTechnician,
    usedFallback: triageData.usedFallback,
  };
};

export const getTriageMetrics = async () => {
  const [totalLogs, fallbackLogs, evaluatedLogs] = await Promise.all([
    prisma.aiTriageLog.count(),
    prisma.aiTriageLog.count({ where: { usedFallback: true } }),
    prisma.aiTriageLog.findMany({
      where: { dispatcherOverrideUrgency: { not: null } },
      select: { predictedUrgency: true, dispatcherOverrideUrgency: true },
    }),
  ]);

  let agreements = 0;
  for (const log of evaluatedLogs) {
    if (log.predictedUrgency === log.dispatcherOverrideUrgency) {
      agreements++;
    }
  }

  const evaluatedCount = evaluatedLogs.length;
  const agreementRate = evaluatedCount > 0 ? Math.round((agreements / evaluatedCount) * 100) : 100;

  return {
    totalTriageCount: totalLogs,
    fallbackFrequency: totalLogs > 0 ? Math.round((fallbackLogs / totalLogs) * 100) : 100,
    humanEvaluatedCount: evaluatedCount,
    dispatcherAgreementRate: agreementRate,
  };
};
