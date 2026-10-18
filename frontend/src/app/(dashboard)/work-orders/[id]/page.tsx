'use client';

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  History,
  MapPin,
  Phone,
  Shield,
  User,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../api/client';
import { LineItemsEditor } from '../../../../components/LineItemsEditor';
import { PriorityBadge } from '../../../../components/PriorityBadge';
import { StatusBadge } from '../../../../components/StatusBadge';
import { StatusStepper } from '../../../../components/StatusStepper';
import { useAuth } from '../../../../context/AuthContext';
import type { WorkOrder } from '../../../../types';

export default function WorkOrderDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const idStr = params?.id as string;
  const orderId = Number(idStr);

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (Number.isNaN(orderId)) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.workOrders.get(orderId);
      setOrder(data);
    } catch {
      setError('Failed to load work order details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleOrderUpdated = (updated: WorkOrder) => {
    setOrder(updated);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unscheduled';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
        <span>Loading work order #{idStr}...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Work Orders
        </Link>
        <div className="p-4 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error || 'Work order not found.'}</span>
        </div>
      </div>
    );
  }

  const canEditItems =
    user?.role === 'ADMIN' ||
    user?.role === 'DISPATCHER' ||
    (user?.role === 'TECHNICIAN' && order.technicianId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dispatch Queue
        </Link>
        <span className="text-[11px] font-mono text-zinc-500">
          Created: {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-amber-400">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} size="md" />
              <PriorityBadge priority={order.priority} size="md" />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {order.category}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">{order.title}</h1>
            {order.customer && (
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {order.customer.companyName || order.customer.name} &bull; {order.customer.city}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <StatusStepper
        order={order}
        onStatusUpdated={handleOrderUpdated}
        userRole={user?.role || 'TECHNICIAN'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              Service Request Details & Scope
            </span>
            <p className="text-xs text-zinc-300 bg-zinc-950/60 p-4 rounded border border-zinc-800/80 leading-relaxed whitespace-pre-wrap">
              {order.description}
            </p>
          </div>

          <LineItemsEditor
            order={order}
            onOrderUpdated={handleOrderUpdated}
            canEdit={canEditItems}
          />
        </div>

        <div className="space-y-6">
          {order.customer && (
            <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Site & Contact
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{order.customer.name}</span>
                </div>
                {order.customer.companyName && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{order.customer.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>
                    {order.customer.address}, {order.customer.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-mono">{order.customer.phone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
              Technician & Window
            </span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-zinc-500" /> Crew
                </span>
                <span className="font-medium text-zinc-200">
                  {order.technician ? order.technician.fullName : 'Unassigned'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono block">
                  Scheduled Start
                </span>
                <span className="font-mono text-zinc-300">{formatDate(order.scheduledStart)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono block">
                  Scheduled End
                </span>
                <span className="font-mono text-zinc-300">{formatDate(order.scheduledEnd)}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-500" />
                Audit Trail History
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {order.statusHistory?.length || 0} Events
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {!order.statusHistory || order.statusHistory.length === 0 ? (
                <span className="text-zinc-500 font-mono text-[11px]">
                  No status transitions logged yet.
                </span>
              ) : (
                order.statusHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-2.5 rounded border border-zinc-800 bg-zinc-950/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-zinc-500">
                          {hist.oldStatus || 'NONE'} &rarr;
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-amber-400">
                          {hist.newStatus}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {new Date(hist.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {hist.changedBy && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-zinc-500" />
                        {hist.changedBy.fullName} ({hist.changedBy.role})
                      </span>
                    )}

                    {hist.reason && (
                      <p className="text-[11px] text-zinc-300 italic pt-1 border-t border-zinc-800/60 mt-1">
                        "{hist.reason}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
