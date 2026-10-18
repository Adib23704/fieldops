'use client';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Send,
  Wrench,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { api } from '../api/client';
import type { OrderStatus, WorkOrder } from '../types';

interface StatusStepperProps {
  order: WorkOrder;
  onStatusUpdated: (updatedOrder: WorkOrder) => void;
  userRole: string;
}

const LIFECYCLE_STAGES: Array<{ status: OrderStatus; label: string }> = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'SCHEDULED', label: 'Scheduled' },
  { status: 'DISPATCHED', label: 'Dispatched' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
];

interface AllowedAction {
  targetStatus: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'warning' | 'danger' | 'neutral';
  requiresReason?: boolean;
}

const NEXT_ACTIONS: Record<OrderStatus, AllowedAction[]> = {
  DRAFT: [
    {
      targetStatus: 'SCHEDULED',
      label: 'Lock schedule & assign',
      icon: Clock,
      variant: 'primary',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  SCHEDULED: [
    {
      targetStatus: 'DISPATCHED',
      label: 'Dispatch technician',
      icon: Send,
      variant: 'primary',
    },
    {
      targetStatus: 'DRAFT',
      label: 'Revert to draft',
      icon: RotateCcw,
      variant: 'neutral',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  DISPATCHED: [
    {
      targetStatus: 'IN_PROGRESS',
      label: 'Start on-site work',
      icon: Play,
      variant: 'primary',
    },
    {
      targetStatus: 'SCHEDULED',
      label: 'Recall dispatch',
      icon: RotateCcw,
      variant: 'neutral',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  IN_PROGRESS: [
    {
      targetStatus: 'COMPLETED',
      label: 'Complete work order',
      icon: CheckCircle2,
      variant: 'primary',
    },
    {
      targetStatus: 'PENDING_PARTS',
      label: 'Place on parts hold',
      icon: Wrench,
      variant: 'warning',
      requiresReason: true,
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  PENDING_PARTS: [
    {
      targetStatus: 'IN_PROGRESS',
      label: 'Resume on-site work',
      icon: Play,
      variant: 'primary',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export const StatusStepper: React.FC<StatusStepperProps> = ({
  order,
  onStatusUpdated,
  userRole,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<AllowedAction | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const currentStatus = order.status;
  const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

  const executeTransition = async (action: AllowedAction, reasonText?: string) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await api.workOrders.updateStatus(order.id, {
        status: action.targetStatus,
        reason: reasonText || undefined,
      });

      onStatusUpdated(updated);
      setPendingAction(null);
      setReasonInput('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Transition rejected. Please verify business rule conditions.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (action: AllowedAction) => {
    if (action.requiresReason) {
      setPendingAction(action);
      setReasonInput('');
    } else {
      executeTransition(action);
    }
  };

  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.status === currentStatus);

  return (
    <div className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b202c]">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Lifecycle Progress</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic state progression & dispatch checkpoints
          </p>
        </div>
        <div className="text-xs font-medium text-slate-300">
          Status: <span className="font-semibold text-blue-400">{currentStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isPassed = currentStageIndex >= 0 && idx < currentStageIndex;
          const isCurrent = stage.status === currentStatus;
          const isHoldActive = currentStatus === 'PENDING_PARTS' && stage.status === 'IN_PROGRESS';

          let cardBg = 'bg-[#0b0d13] border-[#1d222e] text-slate-400';
          let indicatorBg = 'bg-slate-800 text-slate-400';

          if (isCurrent) {
            cardBg = 'bg-blue-950/30 border-blue-800/50 text-blue-300';
            indicatorBg = 'bg-blue-600 text-white font-bold';
          } else if (isPassed) {
            cardBg = 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300';
            indicatorBg = 'bg-emerald-600 text-white font-bold';
          } else if (isHoldActive) {
            cardBg = 'bg-orange-950/30 border-orange-800/50 text-orange-300';
            indicatorBg = 'bg-orange-600 text-white font-bold';
          }

          return (
            <div
              key={stage.status}
              className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${cardBg}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${indicatorBg}`}
                >
                  {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className="text-xs font-medium">
                  {isHoldActive ? 'Parts Hold' : stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {currentStatus === 'PENDING_PARTS' && (
        <div className="p-3.5 rounded-lg bg-orange-950/30 border border-orange-800/40 text-xs text-orange-200 flex items-start gap-3">
          <Wrench className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-orange-300 block">
              Job Paused: Waiting for Parts Delivery
            </span>
            <p className="text-slate-400 text-xs mt-0.5">
              Work on site is suspended pending component requisition fulfillment.
            </p>
          </div>
        </div>
      )}

      {currentStatus === 'CANCELLED' && (
        <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-200 flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-red-300 block">Work Order Cancelled</span>
            <p className="text-slate-400 text-xs mt-0.5">
              This order has been aborted. Invoicing and scheduling are locked.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-1">
        <span className="text-xs font-medium text-slate-400 block mb-2.5">
          Available Lifecycle Actions
        </span>

        {isTerminal ? (
          <div className="p-3 rounded-lg border border-[#1e2432] bg-[#0c0e14] text-xs text-slate-400">
            This job has reached a terminal state ({currentStatus.toLowerCase()}). Further
            transitions are disabled.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {(NEXT_ACTIONS[currentStatus] || [])
              .filter((action) => {
                if (userRole === 'TECHNICIAN' && action.targetStatus === 'CANCELLED') {
                  return false;
                }
                return true;
              })
              .map((action) => {
                const Icon = action.icon;
                let btnClass = 'bg-[#151923] hover:bg-[#1c2130] text-slate-200 border-[#222836]';

                if (action.variant === 'primary') {
                  btnClass =
                    'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20 font-medium';
                } else if (action.variant === 'warning') {
                  btnClass =
                    'bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 border-orange-800/40';
                } else if (action.variant === 'danger') {
                  btnClass = 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-800/40';
                }

                return (
                  <button
                    key={action.targetStatus}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleActionClick(action)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs border transition-all cursor-pointer disabled:opacity-40 ${btnClass}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#11141c] border border-[#202634] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">
                Confirm Status Change &rarr; {pendingAction.targetStatus}
              </h3>
              <p className="text-xs text-slate-400">
                Please enter a reason or notes for the audit trail.
              </p>
            </div>

            <textarea
              required
              rows={3}
              placeholder={
                pendingAction.targetStatus === 'PENDING_PARTS'
                  ? 'Specify required parts, PO number, or supplier delivery timeline...'
                  : 'Specify reason for cancellation...'
              }
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-100 p-3 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1f2533]">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#202634] bg-[#151923] text-slate-300 hover:bg-[#1c2130] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reasonInput.trim() || isSubmitting}
                onClick={() => executeTransition(pendingAction, reasonInput.trim())}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 cursor-pointer shadow-sm shadow-blue-500/20"
              >
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
