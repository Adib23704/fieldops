'use client';

import { AlertCircle, ChevronRight, Plus, RefreshCw, Search, User, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { CreateOrderModal } from '../../../components/CreateOrderModal';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { StatusBadge } from '../../../components/StatusBadge';
import { WorkOrderDrawer } from '../../../components/WorkOrderDrawer';
import { useAuth } from '../../../context/AuthContext';
import type { WorkOrder } from '../../../types';

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'All Jobs' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'DISPATCHED', label: 'Dispatched' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'PENDING_PARTS', label: 'Pending Parts' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function WorkOrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [technicians, setTechnicians] = useState<Array<{ id: number; fullName: string }>>([]);

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: {
        status?: string;
        priority?: string;
        search?: string;
        technicianId?: number;
      } = {};

      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedTech) params.technicianId = Number(selectedTech);

      if (user?.role === 'TECHNICIAN') {
        params.technicianId = user.id;
      }

      const res = await api.workOrders.list(params);
      setOrders(res.items);
      setTotalCount(res.pagination.total);
    } catch {
      setError('Failed to fetch work orders.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedPriority, searchQuery, selectedTech, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const loadTechs = async () => {
      try {
        const res = await api.technicians.list();
        setTechnicians(res);
      } catch {
        // Non-critical
      }
    };
    if (user?.role !== 'TECHNICIAN') {
      loadTechs();
    }
  }, [user]);

  const handleOrderCreated = (newOrder: WorkOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setTotalCount((c) => c + 1);
    setSelectedOrder(newOrder);
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `$${(num || 0).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Work Orders</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Dispatch queue, active state machine progression, and crew assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-700 rounded transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {user?.role !== 'TECHNICIAN' && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Work Order
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {STATUS_FILTERS.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`text-xs px-3 py-1.5 rounded font-mono transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by title, order #, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-100 pl-9 pr-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            {user?.role !== 'TECHNICIAN' && (
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
            <span>Loading dispatch queue...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Wrench className="w-8 h-8 text-zinc-600 stroke-1" />
            <span className="text-xs font-mono">No work orders match the current criteria.</span>
            {user?.role !== 'TECHNICIAN' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-mono text-amber-400 hover:underline mt-1"
              >
                + Create new work order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-4 font-medium">Order #</th>
                  <th className="py-2.5 px-4 font-medium">Customer & Site</th>
                  <th className="py-2.5 px-4 font-medium">Title & Category</th>
                  <th className="py-2.5 px-4 font-medium">Priority</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Assigned Tech</th>
                  <th className="py-2.5 px-4 font-medium">Scheduled</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400 whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-4">
                      {order.customer ? (
                        <div className="flex flex-col max-w-45">
                          <span className="font-medium text-zinc-200 truncate">
                            {order.customer.companyName || order.customer.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono truncate">
                            {order.customer.city}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col max-w-55">
                        <span className="font-medium text-zinc-100 truncate group-hover:text-amber-300 transition-colors">
                          {order.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase">
                          {order.category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={order.priority} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {order.technician ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span>{order.technician.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-mono">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-400 text-[11px]">
                      {formatDate(order.scheduledStart)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-zinc-200 font-medium whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/work-orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
                        title="View Full Lifecycle Details"
                      >
                        <span className="text-[11px] font-medium hidden sm:inline">Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WorkOrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleOrderCreated}
      />
    </div>
  );
}
