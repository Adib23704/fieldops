'use client';

import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Check,
  Gauge,
  Percent,
  RefreshCw,
  RotateCcw,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import type { AiTriageLog, OrderPriority, TriageMetrics, TriageResult } from '../../../types';

const BENCHMARK_SCENARIOS = [
  {
    title: 'Walk-in Freezer Failure',
    category: 'REFRIGERATION',
    text: 'Walk-in freezer temperature alarm is beeping at 46°F, coils covered in heavy frost, and $15,000 of fresh seafood at risk of immediate spoilage.',
  },
  {
    title: 'Kitchen Sewage Backup',
    category: 'PLUMBING',
    text: 'Main grease trap and floor drain backing up contaminated blackwater onto the restaurant kitchen floor during lunch service rush.',
  },
  {
    title: 'RTU Arc & Sparking',
    category: 'ELECTRICAL',
    text: 'Rooftop unit RTU-2 emitted visible sparks, strong electrical burning odor, and tripped the 400A main building breaker.',
  },
  {
    title: 'Quarterly HVAC Maintenance',
    category: 'HVAC',
    text: 'Scheduled quarterly seasonal inspection and pleat air filter replacement for second-floor corporate suites.',
  },
];

export default function TriageStudioPage() {
  const [description, setDescription] = useState('');
  const [categoryHint, setCategoryHint] = useState('HVAC');
  const [isInferencing, setIsInferencing] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<TriageMetrics | null>(null);
  const [logs, setLogs] = useState<AiTriageLog[]>([]);
  const [_isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [evaluatingLogId, setEvaluatingLogId] = useState<number | null>(null);

  const fetchTelemetry = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const [m, l] = await Promise.all([api.ai.metrics(), api.ai.logs(12)]);
      setMetrics(m);
      setLogs(l);
    } catch {
      // Non-critical
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  const handleRunTriage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim()) {
      setInferenceError('Please provide a complaint description to test triage classification.');
      return;
    }

    setInferenceError(null);
    setIsInferencing(true);

    try {
      const res = await api.ai.triage({
        description: description.trim(),
        categoryHint,
      });
      setTriageResult(res);
      fetchTelemetry();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInferenceError(err.message);
      } else {
        setInferenceError('AI triage pipeline encountered an error. Please verify configuration.');
      }
    } finally {
      setIsInferencing(false);
    }
  };

  const handleApplyPreset = (preset: (typeof BENCHMARK_SCENARIOS)[0]) => {
    setDescription(preset.text);
    setCategoryHint(preset.category);
    setTriageResult(null);
    setInferenceError(null);
  };

  const handleEvaluateLog = async (logId: number, override: OrderPriority) => {
    setEvaluatingLogId(logId);
    try {
      const updated = await api.ai.evaluate(logId, override);
      setLogs((prev) => prev.map((item) => (item.id === logId ? updated : item)));
      const m = await api.ai.metrics();
      setMetrics(m);
    } catch {
      // ignore
    } finally {
      setEvaluatingLogId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">AI Triage Assistant</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Dual-engine classification, urgency scoring, technician matching, and evaluation loop
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchTelemetry()}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[#202634] bg-[#11141c] text-slate-300 hover:bg-[#161a24] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Telemetry
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Total Inferences
            </span>
            <div className="text-xl font-bold text-slate-100 font-mono tabular-nums">
              {metrics ? metrics.totalTriageCount : '-'}
            </div>
            <span className="text-[11px] text-slate-500 block">All-time triage requests</span>
          </div>

          <div className="p-4 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Heuristic Fallback
            </span>
            <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
              {metrics ? `${metrics.fallbackFrequency}%` : '-'}
            </div>
            <span className="text-[11px] text-slate-500 block">Fallback frequency rate</span>
          </div>

          <div className="p-4 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" /> Dispatcher Reviews
            </span>
            <div className="text-xl font-bold text-sky-300 font-mono tabular-nums">
              {metrics ? metrics.humanEvaluatedCount : '-'}
            </div>
            <span className="text-[11px] text-slate-500 block">Audited decisions</span>
          </div>

          <div className="p-4 rounded-xl border border-[#1e2432] bg-[#11141c] space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" /> Model Concordance
            </span>
            <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
              {metrics ? `${metrics.dispatcherAgreementRate}%` : '-'}
            </div>
            <span className="text-[11px] text-slate-500 block">Dispatcher agreement rate</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1b202c]">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-100">Triage Test Simulator</h2>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-2">Sample Benchmark Scenarios:</span>
              <div className="flex flex-wrap gap-2">
                {BENCHMARK_SCENARIOS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#202634] bg-[#0c0e14] hover:border-blue-500/40 hover:bg-[#141822] text-slate-300 transition-colors cursor-pointer"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunTriage} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="complaintText"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Customer Complaint or Symptoms Description *
                </label>
                <textarea
                  id="complaintText"
                  rows={4}
                  required
                  placeholder="Enter equipment sounds, temperature alarms, water leaks, or electrical symptoms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-100 p-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Category Hint:</span>
                  <select
                    value={categoryHint}
                    onChange={(e) => setCategoryHint(e.target.value)}
                    className="text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="HVAC">HVAC</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="REFRIGERATION">Refrigeration</option>
                    <option value="APPLIANCE">Appliance</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInferencing || !description.trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  {isInferencing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Run AI Triage
                    </>
                  )}
                </button>
              </div>
            </form>

            {inferenceError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inferenceError}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b202c]">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-100">Diagnostic Result</h2>
              </div>
              {triageResult && (
                <span className="text-xs text-slate-400">
                  Engine:{' '}
                  <span className="text-blue-400 font-medium">
                    {triageResult.usedFallback ? 'Heuristic Matrix' : 'Gemini AI'}
                  </span>
                </span>
              )}
            </div>

            {!triageResult ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto" />
                <span className="text-sm font-medium text-slate-300 block">
                  Awaiting simulation input
                </span>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click a benchmark scenario on the left or type your own description to test the
                  dual-engine classification.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-[#1d222e] bg-[#0c0e14]">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      Urgency Classification
                    </span>
                    <PriorityBadge priority={triageResult.predictedUrgency} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Predicted Category</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {triageResult.predictedCategory}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#1d222e] bg-[#0c0e14] space-y-2">
                  <span className="text-xs font-medium text-slate-400 block">
                    Recommended Technician Match
                  </span>
                  {triageResult.suggestedTechnician ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-200">
                          {triageResult.suggestedTechnician.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">
                            {triageResult.suggestedTechnician.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Skills: {triageResult.suggestedTechnician.skillCategories.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Active Workload</span>
                        <span className="font-mono font-medium text-slate-200">
                          {triageResult.suggestedTechnician.activeOrdersCount} active orders
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">
                      No available technician match found
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg border border-[#1d222e] bg-[#0c0e14]">
                    <span className="text-[11px] text-slate-400 block">Confidence</span>
                    <span className="font-mono font-semibold text-emerald-400 text-sm">
                      {triageResult.confidenceScore}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#1d222e] bg-[#0c0e14]">
                    <span className="text-[11px] text-slate-400 block">Engine</span>
                    <span className="font-medium text-blue-400 text-xs">
                      {triageResult.usedFallback ? 'Heuristic' : 'Gemini AI'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#1d222e] bg-[#0c0e14]">
                    <span className="text-[11px] text-slate-400 block">Symptoms</span>
                    <span className="font-mono font-semibold text-slate-200 text-sm">
                      {triageResult.extractedSymptoms.length}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Isolated Symptom Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {triageResult.extractedSymptoms.length === 0 ? (
                      <span className="text-slate-500 italic">None isolated</span>
                    ) : (
                      triageResult.extractedSymptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]"
                        >
                          {symptom}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">
                    Diagnostic Explanation
                  </span>
                  <p className="text-xs text-slate-300 bg-[#0c0e14] p-3 rounded-lg border border-[#1d222e] leading-relaxed">
                    {triageResult.reasoningSummary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b202c]">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Dispatcher Feedback & Audit Log
              </h2>
            </div>
            <span className="text-xs text-slate-400">{logs.length} Recent Inferences</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#1d222e]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0e14] border-b border-[#1d222e] text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-2.5 px-3">
                    Complaint Scope
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Urgency
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Category
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Engine
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Latency
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Review Status
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Dispatcher Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b202c]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No triage inference logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isEvaluated = log.dispatcherAgreed !== null;
                    const isPending = evaluatingLogId === log.id;

                    return (
                      <tr key={log.id} className="hover:bg-[#151923] transition-colors">
                        <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate font-medium">
                          {log.inputDescription}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <PriorityBadge priority={log.predictedUrgency} />
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{log.predictedCategory}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.usedFallback ? (
                            <span className="text-amber-400 text-[11px] font-medium">
                              Heuristic
                            </span>
                          ) : (
                            <span className="text-blue-400 text-[11px] font-medium">LLM</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {log.latencyMs}ms
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.dispatcherAgreed === true && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-xs">
                              <Check className="w-3.5 h-3.5" /> Agreed
                            </span>
                          )}
                          {log.dispatcherAgreed === false && (
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Overridden ({log.overrideUrgency})
                            </span>
                          )}
                          {log.dispatcherAgreed === null && (
                            <span className="text-slate-500 text-xs">Pending Review</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isEvaluated ? (
                            <span className="text-slate-500 text-xs">Recorded</span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleEvaluateLog(log.id, log.predictedUrgency)}
                                className="px-2 py-1 text-xs rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/25 hover:bg-blue-600/25 transition-colors cursor-pointer font-medium"
                              >
                                {isPending ? '...' : 'Agree'}
                              </button>
                              <select
                                disabled={isPending}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleEvaluateLog(log.id, e.target.value as OrderPriority);
                                  }
                                }}
                                className="px-1.5 py-1 text-xs rounded-md border border-[#232a36] bg-[#0c0e14] text-slate-300 cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Override...
                                </option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="EMERGENCY">Urgent</option>
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
