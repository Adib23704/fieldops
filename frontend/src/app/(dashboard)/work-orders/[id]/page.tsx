'use client';

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../api/client';
import { CreateOrderModal } from '../../../../components/CreateOrderModal';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
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
      setError('Unable to load work order details.');
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
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Loading work order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error || 'Work order does not exist or has been removed.'}</span>
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
      <div className="flex items-center justify-between">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Work Orders
        </Link>

        <span className="text-xs text-slate-500">Created {formatDate(order.createdAt)}</span>
      </div>

      <div className="p-6 rounded-2xl border border-[#1e2432] bg-[#11141c] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-sm font-semibold text-blue-400">
              {order.orderNumber}
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {order.category}
            </span>
            <PriorityBadge priority={order.priority} />
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                Edit Order
              </button>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Balance</span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                $
                {(typeof order.totalAmount === 'string'
                  ? parseFloat(order.totalAmount)
                  : order.totalAmount || 0
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-100 tracking-tight">{order.title}</h1>
      </div>

      {user && (
        <StatusStepper order={order} onStatusUpdated={handleOrderUpdated} userRole={user.role} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Problem Description & Symptoms</h3>
            <div className="p-4 rounded-xl border border-[#1d222e] bg-[#0c0e14] text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {order.description}
            </div>
          </div>

          <LineItemsEditor
            order={order}
            onOrderUpdated={handleOrderUpdated}
            canEdit={canEditItems}
          />
        </div>

        <div className="space-y-6">
          {order.customer && (
            <div className="p-5 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer & Site Location
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-medium text-slate-200 text-sm">{order.customer.name}</div>
                  {order.customer.companyName && (
                    <div className="text-slate-400 mt-0.5">{order.customer.companyName}</div>
                  )}
                </div>

                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    {order.customer.address}, {order.customer.city}
                    {order.customer.postalCode ? ` ${order.customer.postalCode}` : ''}
                  </span>
                </div>

                {order.customer.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}

                {order.customer.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{order.customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-5 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Field Crew
            </h3>
            {order.technician ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-200 text-xs">
                    {order.technician.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">{order.technician.fullName}</div>
                    <div className="text-slate-400 text-[11px]">{order.technician.email}</div>
                  </div>
                </div>
                {order.technician.phone && (
                  <div className="flex items-center gap-2 text-slate-400 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.technician.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No technician currently assigned to this order.
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Schedule Window
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Start Time
                </span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {formatDate(order.scheduledStart)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> End Time
                </span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {formatDate(order.scheduledEnd)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Status Audit History
            </h3>

            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="space-y-3 text-xs">
                {order.statusHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-lg border border-[#1d222e] bg-[#0c0e14] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">
                        {h.oldStatus || 'INTAKE'} &rarr; {h.newStatus}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(h.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {h.reason && (
                      <p className="text-slate-400 text-[11px] italic">&ldquo;{h.reason}&rdquo;</p>
                    )}
                    {h.changedBy && (
                      <div className="text-[10px] text-slate-500">
                        Updated by {h.changedBy.fullName} ({h.changedBy.role})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Initial creation record. No subsequent status transitions logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <CreateOrderModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onCreated={handleOrderUpdated}
          orderToEdit={order}
        />
      )}
    </div>
  );
}
