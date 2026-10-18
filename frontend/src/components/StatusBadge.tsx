'use client';

import type React from 'react';
import type { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    dot: 'bg-zinc-400',
  },
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'bg-blue-950/60',
    text: 'text-blue-300',
    border: 'border-blue-800/60',
    dot: 'bg-blue-400',
  },
  DISPATCHED: {
    label: 'Dispatched',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/60',
    dot: 'bg-indigo-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
  },
  PENDING_PARTS: {
    label: 'Pending Parts',
    bg: 'bg-orange-950/60',
    text: 'text-orange-300',
    border: 'border-orange-800/60',
    dot: 'bg-orange-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-950/60',
    text: 'text-rose-300',
    border: 'border-rose-800/60',
    dot: 'bg-rose-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const cfg = statusConfig[status] || statusConfig.DRAFT;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-mono ${cfg.bg} ${cfg.text} ${cfg.border} ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className="font-medium">{cfg.label}</span>
    </span>
  );
};
