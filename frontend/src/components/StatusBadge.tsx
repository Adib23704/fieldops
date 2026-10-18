'use client';

import type React from 'react';
import type { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-300',
    dot: 'bg-zinc-400',
    border: 'border-zinc-700/60',
  },
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    border: 'border-blue-500/20',
  },
  DISPATCHED: {
    label: 'Dispatched',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    border: 'border-indigo-500/20',
  },
  IN_PROGRESS: {
    label: 'In progress',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
  },
  PENDING_PARTS: {
    label: 'Parts hold',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    border: 'border-orange-500/20',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    border: 'border-rose-500/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const cfg = statusConfig[status] || statusConfig.DRAFT;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        cfg.bg
      } ${cfg.text} ${cfg.border} ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
};
