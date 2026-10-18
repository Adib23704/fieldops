'use client';

import { AlertCircle } from 'lucide-react';
import type React from 'react';
import type { OrderPriority } from '../types';

interface PriorityBadgeProps {
  priority: OrderPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  if (priority === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span>Urgent</span>
      </span>
    );
  }

  if (priority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
        <span className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1.5 bg-amber-400 rounded-xs" />
          <span className="w-0.5 h-2.5 bg-amber-400 rounded-xs" />
          <span className="w-0.5 h-3 bg-amber-400 rounded-xs" />
        </span>
        <span>High</span>
      </span>
    );
  }

  if (priority === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
        <span className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1.5 bg-blue-400 rounded-xs" />
          <span className="w-0.5 h-2.5 bg-blue-400 rounded-xs" />
          <span className="w-0.5 h-3 bg-zinc-600 rounded-xs" />
        </span>
        <span>Medium</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs font-medium">
      <span className="flex items-end gap-0.5 h-3">
        <span className="w-0.5 h-1.5 bg-zinc-400 rounded-xs" />
        <span className="w-0.5 h-2.5 bg-zinc-600 rounded-xs" />
        <span className="w-0.5 h-3 bg-zinc-600 rounded-xs" />
      </span>
      <span>Low</span>
    </span>
  );
};
