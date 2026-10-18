'use client';

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';
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
  { id: 'PENDING_PARTS', label: 'Parts Hold' },
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
  const [orderToEdit, setOrderToEdit] = useState<WorkOrder | null>(null);
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
      setError('Unable to load work orders. Please check your connection and retry.');
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

  const handleOrderSaved = (savedOrder: WorkOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === savedOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOrder.id ? savedOrder : o));
      }
      return [savedOrder, ...prev];
    });
    if (!orderToEdit) {
      setTotalCount((c) => c + 1);
    }
    setSelectedOrder(savedOrder);
    setOrderToEdit(null);
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `$${(num || 0).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const inProgressCount = orders.filter(
    (o) => o.status === 'IN_PROGRESS' || o.status === 'DISPATCHED'
  ).length;
  const partsHoldCount = orders.filter((o) => o.status === 'PENDING_PARTS').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Work Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time field service dispatch queue and job lifecycle board
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#151923] border border-[#202634] rounded-lg transition-colors cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {user?.role !== 'TECHNICIAN' && (
            <button
              type="button"
              onClick={() => {
                setOrderToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Work Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[#1e2432] bg-[#10131a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total in View</span>
            <div className="text-lg font-bold text-slate-100 mt-0.5 font-mono">{totalCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#1e2432] bg-[#10131a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Active in Field</span>
            <div className="text-lg font-bold text-blue-400 mt-0.5 font-mono">
              {inProgressCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-950/50 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#1e2432] bg-[#10131a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Parts Hold</span>
            <div className="text-lg font-bold text-orange-400 mt-0.5 font-mono">
              {partsHoldCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-orange-950/50 border border-orange-800/40 flex items-center justify-center text-orange-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#1e2432] bg-[#10131a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Completed</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
              {completedCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border-blue-500/30'
                    : 'bg-[#10131a] text-slate-400 hover:text-slate-200 hover:bg-[#151923] border-[#1e2432]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by order #, title, or customer site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#10131a] text-slate-100 pl-9 pr-3.5 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs rounded-lg border border-[#202634] bg-[#10131a] text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="EMERGENCY">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {user?.role !== 'TECHNICIAN' && (
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="text-xs rounded-lg border border-[#202634] bg-[#10131a] text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}

            {(selectedStatus !== 'ALL' || selectedPriority || searchQuery || selectedTech) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedPriority('');
                  setSearchQuery('');
                  setSelectedTech('');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-2 rounded-lg border border-[#202634] hover:bg-[#151923] transition-colors"
                title="Reset filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#1e2432] bg-[#11141c] overflow-hidden shadow-xs">
        {error && (
          <div className="p-4 bg-red-950/40 border-b border-red-800/40 text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0e14] border-b border-[#1e2432] text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4">
                  Order
                </th>
                <th scope="col" className="py-3 px-4">
                  Title & Scope
                </th>
                <th scope="col" className="py-3 px-4">
                  Customer & Site
                </th>
                <th scope="col" className="py-3 px-4">
                  Assigned Crew
                </th>
                <th scope="col" className="py-3 px-4">
                  Scheduled
                </th>
                <th scope="col" className="py-3 px-4">
                  Priority
                </th>
                <th scope="col" className="py-3 px-4">
                  Status
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Total
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b202c]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                      <span>Loading work order queue...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                      <Clock className="w-6 h-6 text-slate-600 mb-1" />
                      <span className="font-medium text-slate-300">No work orders found</span>
                      <p className="text-xs text-slate-400">
                        {searchQuery || selectedPriority || selectedStatus !== 'ALL'
                          ? 'Try adjusting your search query or active filter settings.'
                          : 'No field service orders have been registered yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-[#161a24] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-400 whitespace-nowrap">
                        {order.orderNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                          {order.title}
                        </div>
                        <span className="text-[11px] text-slate-400">{order.category}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 line-clamp-1">
                          {order.customer?.companyName || order.customer?.name || '-'}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {order.customer?.city || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {order.technician ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-300 shrink-0">
                              {order.technician.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">{order.technician.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(order.scheduledStart)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={order.priority} />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {user?.role === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToEdit(order);
                                setIsCreateModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-[#1f2533] transition-colors cursor-pointer"
                              title="Edit work order (Admin only)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="inline-flex p-1 text-slate-500 group-hover:text-blue-400 transition-colors cursor-pointer"
                            title="View order drawer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WorkOrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onEdit={(order) => {
          setSelectedOrder(null);
          setOrderToEdit(order);
          setIsCreateModalOpen(true);
        }}
      />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setOrderToEdit(null);
        }}
        onCreated={handleOrderSaved}
        orderToEdit={orderToEdit}
      />
    </div>
  );
}
