'use client';

import {
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  User,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useEffect } from 'react';
import type { WorkOrder } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface WorkOrderDrawerProps {
  order: WorkOrder | null;
  onClose: () => void;
}

export const WorkOrderDrawer: React.FC<WorkOrderDrawerProps> = ({ order, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `$${(num || 0).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Close drawer backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
          <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-amber-400">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} />
                <PriorityBadge priority={order.priority} />
              </div>
              <h2 className="text-base font-semibold text-zinc-100">{order.title}</h2>
              <span className="text-[11px] font-mono text-zinc-400 block">
                Category: <span className="text-zinc-200">{order.category}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Job Description
              </span>
              <p className="text-xs text-zinc-300 bg-zinc-950/50 p-3 rounded border border-zinc-800 leading-relaxed whitespace-pre-wrap">
                {order.description}
              </p>
            </div>

            {order.customer && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Customer & Site Information
                </span>
                <div className="p-3 rounded border border-zinc-800 bg-zinc-950/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-100">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{order.customer.name}</span>
                    {order.customer.companyName && (
                      <span className="text-zinc-400 font-normal flex items-center gap-1">
                        &bull; <Building2 className="w-3 h-3 text-zinc-500" />
                        {order.customer.companyName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>
                      {order.customer.address}, {order.customer.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="font-mono">{order.customer.phone}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Dispatch & Schedule
              </span>
              <div className="p-3 rounded border border-zinc-800 bg-zinc-950/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                    Assigned Technician
                  </span>
                  <span className="font-medium text-zinc-200">
                    {order.technician ? order.technician.fullName : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Scheduled Start
                  </span>
                  <span className="font-mono text-zinc-300">
                    {formatDate(order.scheduledStart)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Scheduled End
                  </span>
                  <span className="font-mono text-zinc-300">{formatDate(order.scheduledEnd)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Financial Breakdown
              </span>
              <div className="p-3 rounded border border-zinc-800 bg-zinc-950/50 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-200">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Sales Tax (8.25%)</span>
                  <span className="font-mono text-zinc-200">{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-zinc-100 pt-2 border-t border-zinc-800">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Total Invoice Amount
                  </span>
                  <span className="font-mono text-emerald-400 text-sm">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>

            <Link
              href={`/work-orders/${order.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors"
            >
              Manage Work Order & Stepper
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
