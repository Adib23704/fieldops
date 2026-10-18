'use client';

import type React from 'react';
import type { OrderPriority } from '../types';

interface PriorityBadgeProps {
  priority: OrderPriority;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<
  OrderPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    border: 'border-zinc-700/60',
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-sky-950/50',
    text: 'text-sky-300',
    border: 'border-sky-800/50',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/60',
  },
  EMERGENCY: {
    label: 'Emergency',
    bg: 'bg-red-950/80',
    text: 'text-red-200',
    border: 'border-red-700',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const cfg = priorityConfig[priority] || priorityConfig.MEDIUM;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center rounded border font-mono uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} ${
        isSmall ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      {cfg.label}
    </span>
  );
};
