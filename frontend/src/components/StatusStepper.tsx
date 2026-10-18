'use client';

import {
  AlertCircle,
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

const ORDERED_STEPS: OrderStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'DISPATCHED',
  'IN_PROGRESS',
  'COMPLETED',
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
      label: 'Schedule & Assign',
      icon: Clock,
      variant: 'primary',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  SCHEDULED: [
    {
      targetStatus: 'DISPATCHED',
      label: 'Dispatch Crew',
      icon: Send,
      variant: 'primary',
    },
    {
      targetStatus: 'DRAFT',
      label: 'Revert to Draft',
      icon: RotateCcw,
      variant: 'neutral',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  DISPATCHED: [
    {
      targetStatus: 'IN_PROGRESS',
      label: 'Start Work On-Site',
      icon: Play,
      variant: 'primary',
    },
    {
      targetStatus: 'SCHEDULED',
      label: 'Recall Dispatch',
      icon: RotateCcw,
      variant: 'neutral',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  IN_PROGRESS: [
    {
      targetStatus: 'COMPLETED',
      label: 'Complete Work Order',
      icon: CheckCircle2,
      variant: 'primary',
    },
    {
      targetStatus: 'PENDING_PARTS',
      label: 'Hold for Parts',
      icon: Wrench,
      variant: 'warning',
      requiresReason: true,
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'danger',
      requiresReason: true,
    },
  ],
  PENDING_PARTS: [
    {
      targetStatus: 'IN_PROGRESS',
      label: 'Resume Work (Parts In)',
      icon: Play,
      variant: 'primary',
    },
    {
      targetStatus: 'CANCELLED',
      label: 'Cancel Order',
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
        setError('Failed to update status.');
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

  const getStepIndex = (s: OrderStatus) => {
    return ORDERED_STEPS.indexOf(s);
  };

  const currentStepIdx = getStepIndex(currentStatus);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Lifecycle State Machine
          </span>
          <span className="font-mono text-xs font-semibold text-amber-400">
            Current: {currentStatus}
          </span>
        </div>

        <div className="relative flex items-center justify-between">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />

          {ORDERED_STEPS.map((step, idx) => {
            const isPassed = currentStepIdx >= 0 && idx < currentStepIdx;
            const isCurrent = step === currentStatus;
            const isSpecialActive = currentStatus === 'PENDING_PARTS' && step === 'IN_PROGRESS';

            let dotColor = 'bg-zinc-800 border-zinc-700 text-zinc-500';
            if (isCurrent) {
              dotColor =
                'bg-amber-500 border-amber-400 text-zinc-950 font-bold ring-4 ring-amber-500/20';
            } else if (isPassed) {
              dotColor = 'bg-emerald-600 border-emerald-500 text-zinc-100';
            } else if (isSpecialActive) {
              dotColor =
                'bg-orange-500 border-orange-400 text-zinc-950 font-bold ring-4 ring-orange-500/20';
            }

            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] transition-all font-mono ${dotColor}`}
                >
                  {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'text-amber-400 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {currentStatus === 'PENDING_PARTS' && (
          <div className="mt-3 p-2.5 rounded bg-orange-950/40 border border-orange-800/60 text-xs text-orange-200 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[11px]">
              <Wrench className="w-3.5 h-3.5 text-orange-400" />
              STATUS: PENDING_PARTS (On Hold)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Work halted until component delivery
            </span>
          </div>
        )}

        {currentStatus === 'CANCELLED' && (
          <div className="mt-3 p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[11px]">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              TERMINAL STATE: CANCELLED
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Job terminated & audit logged
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-3 border-t border-zinc-800">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
          Allowed Next Transitions
        </span>

        {isTerminal ? (
          <div className="p-3 rounded border border-zinc-800 bg-zinc-950/50 text-xs font-mono text-zinc-400">
            Work order has reached terminal state ({currentStatus}). State is locked against further
            transitions.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(NEXT_ACTIONS[currentStatus] || [])
              .filter((action) => {
                if (userRole === 'TECHNICIAN' && action.targetStatus === 'CANCELLED') {
                  return false;
                }
                return true;
              })
              .map((action) => {
                const Icon = action.icon;
                let btnClass = 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700';

                if (action.variant === 'primary') {
                  btnClass =
                    'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-600 font-semibold';
                } else if (action.variant === 'warning') {
                  btnClass =
                    'bg-orange-950/70 hover:bg-orange-900/80 text-orange-200 border-orange-800/80';
                } else if (action.variant === 'danger') {
                  btnClass = 'bg-red-950/50 hover:bg-red-900/60 text-red-300 border-red-800/60';
                }

                return (
                  <button
                    key={action.targetStatus}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleActionClick(action)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs border transition-colors disabled:opacity-50 ${btnClass}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg max-w-md w-full space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Transition Reason Required
              </h3>
              <p className="text-xs text-zinc-400">
                Transitioning to{' '}
                <span className="font-mono text-amber-400">{pendingAction.targetStatus}</span>{' '}
                requires an audit explanation note.
              </p>
            </div>

            <textarea
              required
              rows={3}
              placeholder={
                pendingAction.targetStatus === 'PENDING_PARTS'
                  ? 'Specify part numbers ordered, vendor names, or expected delivery dates...'
                  : 'Specify reason for order cancellation...'
              }
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 p-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-3 py-1.5 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reasonInput.trim() || isSubmitting}
                onClick={() => executeTransition(pendingAction, reasonInput.trim())}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Transition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
