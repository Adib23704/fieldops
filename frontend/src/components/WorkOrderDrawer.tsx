'use client';

import {
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Phone,
  User,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { WorkOrder } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface WorkOrderDrawerProps {
  order: WorkOrder | null;
  onClose: () => void;
  onEdit?: (order: WorkOrder) => void;
}

export const WorkOrderDrawer: React.FC<WorkOrderDrawerProps> = ({ order, onClose, onEdit }) => {
  const { user } = useAuth();
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
      hour: 'numeric',
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
        aria-label="Close drawer"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#11141c] border-l border-[#1f2533] flex flex-col shadow-2xl">
          <div className="p-5 border-b border-[#1f2533] bg-[#0c0e14] flex items-start justify-between">
            <div className="space-y-1.5 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-blue-400">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} />
                <PriorityBadge priority={order.priority} />
              </div>
              <h2 className="text-base font-semibold text-slate-100 leading-snug">{order.title}</h2>
              <div className="text-xs text-slate-400">
                Category: <span className="text-slate-200 font-medium">{order.category}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a1f2c] transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-2.5 bg-[#0e1117] border-b border-[#1f2533] flex items-center justify-between">
            <span className="text-xs text-slate-400">Quick inspection</span>
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit work order (Admin only)"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Order
                </button>
              )}
              <Link
                href={`/work-orders/${order.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Open full details
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Problem Description & Scope
              </span>
              <div className="text-sm text-slate-300 bg-[#0a0c10] p-4 rounded-xl border border-[#1d222e] leading-relaxed whitespace-pre-wrap">
                {order.description}
              </div>
            </div>

            {order.customer && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                  Customer & Site Location
                </span>
                <div className="p-4 rounded-xl border border-[#1d222e] bg-[#0a0c10] space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{order.customer.name}</span>
                    {order.customer.companyName && (
                      <span className="text-xs text-slate-400">({order.customer.companyName})</span>
                    )}
                  </div>
                  {(order.customer.address || order.customer.city) && (
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        {[order.customer.address, order.customer.city].filter(Boolean).join(', ')}
                        {order.customer.postalCode ? ` ${order.customer.postalCode}` : ''}
                      </span>
                    </div>
                  )}
                  {order.customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{order.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Technician & Schedule
              </span>
              <div className="p-4 rounded-xl border border-[#1d222e] bg-[#0a0c10] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" /> Assigned Crew
                  </span>
                  <span className="font-medium text-slate-200">
                    {order.technician ? order.technician.fullName : 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Scheduled Start
                  </span>
                  <span className="text-slate-300">{formatDate(order.scheduledStart)}</span>
                </div>
                {order.scheduledEnd && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Scheduled End
                    </span>
                    <span className="text-slate-300">{formatDate(order.scheduledEnd)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Financial Summary
              </span>
              <div className="p-4 rounded-xl border border-[#1d222e] bg-[#0a0c10] space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tax (8.25%)</span>
                  <span className="font-mono">{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-[#1d222e] flex justify-between text-sm font-semibold text-slate-100">
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#1f2533] bg-[#0c0e14]">
            <Link
              href={`/work-orders/${order.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-sm shadow-blue-500/20"
            >
              Open Full Work Order Details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
