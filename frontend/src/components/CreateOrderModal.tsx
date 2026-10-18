'use client';

import { AlertCircle, Bot, CheckCircle2, Sparkles, Wrench, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Customer, OrderPriority, TriageResult, WorkOrder } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (order: WorkOrder) => void;
}

interface TechOption {
  id: number;
  fullName: string;
  skillCategories: string[];
  activeOrdersCount: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<TechOption[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('HVAC');
  const [priority, setPriority] = useState<OrderPriority>('MEDIUM');
  const [technicianId, setTechnicianId] = useState<number | ''>('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageSuggestion, setTriageSuggestion] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      try {
        const [custRes, techRes] = await Promise.all([
          api.customers.list(),
          api.technicians.list(),
        ]);
        setCustomers(custRes);
        setTechnicians(techRes);
        if (custRes.length > 0 && customerId === '') {
          setCustomerId(custRes[0].id);
        }
      } catch {
        setError('Failed to load customers or technician options');
      }
    };

    loadFormData();
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleRunAiTriage = async () => {
    if (!description.trim()) {
      setError('Please enter a description first to run AI triage.');
      return;
    }

    setError(null);
    setIsTriaging(true);

    try {
      const res = await api.ai.triage({
        description,
        categoryHint: category,
      });
      setTriageSuggestion(res);
      setCategory(res.predictedCategory);
      setPriority(res.predictedUrgency);
      if (res.suggestedTechnician) {
        setTechnicianId(res.suggestedTechnician.id);
      }
    } catch {
      setError('AI Triage failed. Please configure manually.');
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newOrder = await api.workOrders.create({
        customerId: Number(customerId),
        title,
        description,
        category,
        priority,
        technicianId: technicianId === '' ? null : Number(technicianId),
        scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
      });

      onCreated(newOrder);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create work order.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Create New Work Order</h2>
              <p className="text-[11px] text-zinc-400">
                Log service request, auto-triage symptoms, and schedule technician.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {triageSuggestion && (
          <div className="mt-4 p-3 rounded bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              AI TRIAGE RECOMMENDATION APPLIED
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">{triageSuggestion.reasoningSummary}</p>
            <div className="flex items-center gap-3 mt-2 font-mono text-[10px]">
              <span>Confidence: {(triageSuggestion.confidenceScore * 100).toFixed(0)}%</span>
              <span>Predicted Category: {triageSuggestion.predictedCategory}</span>
              <span>Urgency: {triageSuggestion.predictedUrgency}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customerSelect"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Customer Site *
              </label>
              <select
                id="customerSelect"
                required
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Select commercial customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name} - {c.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="titleInput" className="block text-xs font-medium text-zinc-300 mb-1">
                Order Title *
              </label>
              <input
                id="titleInput"
                type="text"
                required
                placeholder="e.g. Walk-in Freezer Temp Alarm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="descInput" className="block text-xs font-medium text-zinc-300">
                Service Request Description *
              </label>
              <button
                type="button"
                disabled={isTriaging || !description.trim()}
                onClick={handleRunAiTriage}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                {isTriaging ? (
                  <>
                    <div className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Inferencing...
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-amber-400" />
                    Auto-Triage with AI
                  </>
                )}
              </button>
            </div>
            <textarea
              id="descInput"
              required
              rows={3}
              placeholder="Describe equipment malfunction, error codes, temperature readings, or immediate hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 p-3 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="categorySelect"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Equipment Category *
              </label>
              <select
                id="categorySelect"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="HVAC">HVAC</option>
                <option value="REFRIGERATION">REFRIGERATION</option>
                <option value="PLUMBING">PLUMBING</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="APPLIANCE">COMMERCIAL APPLIANCE</option>
                <option value="GENERAL">GENERAL MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="prioritySelect"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Priority Urgency *
              </label>
              <select
                id="prioritySelect"
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="techSelect" className="block text-xs font-medium text-zinc-300 mb-1">
              Assign Technician (Optional - can be scheduled later)
            </label>
            <select
              id="techSelect"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">Leave Unassigned (DRAFT)</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} &bull; Skills: [{t.skillCategories.join(', ')}] &bull; Active Jobs:{' '}
                  {t.activeOrdersCount}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startInput" className="block text-xs font-medium text-zinc-300 mb-1">
                Scheduled Window Start
              </label>
              <input
                id="startInput"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="endInput" className="block text-xs font-medium text-zinc-300 mb-1">
                Scheduled Window End
              </label>
              <input
                id="endInput"
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Create Work Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
