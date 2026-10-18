'use client';

import { AlertCircle, Sparkles, X } from 'lucide-react';
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
        setError('Failed to load customers or technician roster.');
      }
    };

    loadFormData();
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleRunAiTriage = async () => {
    if (!description.trim()) {
      setError('Please provide a problem description before running AI triage.');
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
      setError('AI triage service unavailable. You can manually set category and priority.');
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

    if (!title.trim() || !description.trim()) {
      setError('Title and problem description are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newOrder = await api.workOrders.create({
        customerId: Number(customerId),
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        technicianId: technicianId ? Number(technicianId) : undefined,
        scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      });

      onCreated(newOrder);
      onClose();
      setTitle('');
      setDescription('');
      setTriageSuggestion(null);
      setScheduledStart('');
      setScheduledEnd('');
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
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-[#11141c] border border-[#202634] rounded-2xl max-w-xl w-full shadow-2xl p-6 z-10 space-y-5">
        <div className="flex items-start justify-between pb-4 border-b border-[#1f2533]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">New Work Order</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create and dispatch a new field service request
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a1f2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="customer" className="block text-xs font-medium text-slate-300 mb-1.5">
              Customer & Site *
            </label>
            <select
              id="customer"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select customer site...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-xs font-medium text-slate-300 mb-1.5">
              Job Title *
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Walk-in freezer temperature alarm / compressor repair"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="desc" className="block text-xs font-medium text-slate-300">
                Problem Description & Symptoms *
              </label>
              <button
                type="button"
                onClick={handleRunAiTriage}
                disabled={isTriaging || !description.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/25 hover:bg-blue-600/25 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                {isTriaging ? 'Analyzing...' : 'Run AI Triage'}
              </button>
            </div>
            <textarea
              id="desc"
              rows={3}
              required
              placeholder="Describe customer complaints, equipment sounds, fault codes, or symptoms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 p-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />

            {triageSuggestion && (
              <div className="mt-2 p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-300">
                    AI Triage Recommendation (
                    {triageSuggestion.usedFallback ? 'Heuristic Matrix' : 'Gemini AI'})
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Suggested Urgency:{' '}
                    <span className="font-medium text-white">
                      {triageSuggestion.predictedUrgency}
                    </span>{' '}
                    &bull; Category:{' '}
                    <span className="font-medium text-white">
                      {triageSuggestion.predictedCategory}
                    </span>
                    {triageSuggestion.suggestedTechnician && (
                      <span>
                        {' '}
                        &bull; Matched Tech:{' '}
                        <span className="font-medium text-white">
                          {triageSuggestion.suggestedTechnician.fullName}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    &ldquo;{triageSuggestion.reasoningSummary}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-slate-300 mb-1.5">
                Trade Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="HVAC">HVAC</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="REFRIGERATION">Refrigeration</option>
                <option value="APPLIANCE">Appliance</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs font-medium text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tech" className="block text-xs font-medium text-slate-300 mb-1.5">
              Assigned Technician
            </label>
            <select
              id="tech"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Unassigned (Schedule later)</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.skillCategories.join(', ')}) - {t.activeOrdersCount} active jobs
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start" className="block text-xs font-medium text-slate-300 mb-1.5">
                Scheduled Start
              </label>
              <input
                id="start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end" className="block text-xs font-medium text-slate-300 mb-1.5">
                Scheduled End
              </label>
              <input
                id="end"
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f2533] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151923] border border-[#202634] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
