'use client';

import {
  Activity,
  AlertCircle,
  Bot,
  Check,
  Gauge,
  Percent,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tag,
  User,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import type { AiTriageLog, OrderPriority, TriageMetrics, TriageResult } from '../../../types';

const PRESET_SCENARIOS = [
  {
    title: 'Freezer Temp Spoilage (Urgent)',
    category: 'REFRIGERATION',
    text: 'Walk-in freezer temperature alarm is beeping at 46°F, coils covered in heavy frost, and $15,000 of fresh seafood at risk of immediate spoilage.',
  },
  {
    title: 'Kitchen Sewage Flooding',
    category: 'PLUMBING',
    text: 'Main grease trap and floor drain backing up contaminated blackwater onto the restaurant kitchen floor during lunch service rush.',
  },
  {
    title: 'RTU Sparking & Circuit Breaker',
    category: 'ELECTRICAL',
    text: 'Rooftop unit RTU-2 emitted visible sparks, strong electrical burning odor, and tripped the 400A main building breaker.',
  },
  {
    title: 'Routine Filter Maintenance',
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
      setInferenceError('Please provide a complaint description to triage.');
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
        setInferenceError('Inference failed. Check engine status.');
      }
    } finally {
      setIsInferencing(false);
    }
  };

  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Bot className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">AI Triage Studio</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Dual-engine decision support: LLM natural language reasoning with deterministic
              heuristic fallback & telemetry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchTelemetry()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-zinc-400" /> Total Inferences
            </span>
            <div className="text-xl font-bold font-mono text-zinc-100">
              {metrics ? metrics.totalTriageCount : '—'}
            </div>
            <span className="text-[10px] text-zinc-500">All lifecycle requests</span>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3 text-amber-400" /> Fallback Frequency
            </span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {metrics ? `${metrics.fallbackFrequency}%` : '—'}
            </div>
            <span className="text-[10px] text-zinc-500">Deterministic fallback rate</span>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              <User className="w-3 h-3 text-blue-400" /> Human Evals Logged
            </span>
            <div className="text-xl font-bold font-mono text-blue-400">
              {metrics ? metrics.humanEvaluatedCount : '—'}
            </div>
            <span className="text-[10px] text-zinc-500">Dispatcher audit decisions</span>
          </div>

          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              <Percent className="w-3 h-3 text-emerald-400" /> Dispatcher Agreement
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {metrics ? `${metrics.dispatcherAgreementRate}%` : '—'}
            </div>
            <span className="text-[10px] text-zinc-500">AI prediction accuracy</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live Intake Simulation
              </h2>
              <p className="text-xs text-zinc-400">
                Test how the triage engine parses complaint prose, extracts symptoms, and assigns
                technicians.
              </p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
              Benchmark Scenario Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 text-xs rounded border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunTriage} className="space-y-4">
            <div>
              <label
                htmlFor="complaintText"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Customer Complaint / Work Request Prose *
              </label>
              <textarea
                id="complaintText"
                rows={3}
                required
                placeholder="Describe equipment symptom, environmental conditions, smells, sounds, or immediate hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 p-3 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Category Hint:</span>
                <select
                  value={categoryHint}
                  onChange={(e) => setCategoryHint(e.target.value)}
                  className="text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-200 px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="HVAC">HVAC</option>
                  <option value="REFRIGERATION">REFRIGERATION</option>
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="APPLIANCE">COMMERCIAL APPLIANCE</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isInferencing || !description.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-40 transition-colors shadow-sm"
              >
                {isInferencing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Inferencing Engine...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Execute Triage Inference
                  </>
                )}
              </button>
            </div>
          </form>

          {inferenceError && (
            <div className="p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{inferenceError}</span>
            </div>
          )}

          {triageResult && (
            <div className="p-5 rounded-lg border border-amber-500/30 bg-zinc-950/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-amber-400 uppercase">
                    Inference Output
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      triageResult.usedFallback
                        ? 'bg-orange-950/60 text-orange-300 border-orange-800/60'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    }`}
                  >
                    {triageResult.usedFallback
                      ? 'DETERMINISTIC HEURISTIC ENGINE'
                      : 'PRIMARY LLM NEURAL ENGINE'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">Confidence:</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {(triageResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Predicted Urgency
                  </span>
                  <PriorityBadge priority={triageResult.predictedUrgency} size="md" />
                </div>

                <div className="p-3 rounded border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Classified Category
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-200">
                    {triageResult.predictedCategory}
                  </span>
                </div>

                <div className="p-3 rounded border border-zinc-800 bg-zinc-900/60 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Matched Technician
                  </span>
                  {triageResult.suggestedTechnician ? (
                    <div className="text-xs">
                      <span className="font-medium text-amber-400">
                        {triageResult.suggestedTechnician.fullName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        Active Jobs: {triageResult.suggestedTechnician.activeOrdersCount}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">None qualified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5 items-center gap-1.5">
                  <Tag className="w-3 h-3 text-zinc-500" /> Extracted Symptom Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {triageResult.extractedSymptoms.length === 0 ? (
                    <span className="text-xs text-zinc-500 font-mono">None isolated</span>
                  ) : (
                    triageResult.extractedSymptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        {symptom}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  Decision Reasoning
                </span>
                <p className="text-xs text-zinc-300 bg-zinc-900/50 p-3 rounded border border-zinc-800 leading-relaxed font-mono">
                  {triageResult.reasoningSummary}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Human-in-the-Loop Evaluation Logs
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dispatchers review telemetry logs and confirm or override AI predictions to
                calibrate model performance.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">{logs.length} Recent Logs</span>
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-950/60 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-3">Complaint Text</th>
                  <th className="py-2.5 px-3">AI Urgency</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Fallback</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Agreement</th>
                  <th className="py-2.5 px-3 text-right">Human Evaluation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                      No triage inference logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isEvaluated = log.dispatcherAgreed !== null;
                    const isPending = evaluatingLogId === log.id;

                    return (
                      <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 px-3 font-sans text-zinc-300 max-w-xs truncate">
                          {log.inputDescription}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <PriorityBadge priority={log.predictedUrgency} />
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          {log.predictedCategory}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.usedFallback ? (
                            <span className="text-amber-400 text-[10px]">Fallback</span>
                          ) : (
                            <span className="text-zinc-500 text-[10px]">LLM</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">{log.latencyMs}ms</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.dispatcherAgreed === true && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                              <Check className="w-3 h-3" /> Agreed
                            </span>
                          )}
                          {log.dispatcherAgreed === false && (
                            <span className="inline-flex items-center gap-1 text-red-400 text-[10px]">
                              <XCircle className="w-3 h-3" /> Overridden ({log.overrideUrgency})
                            </span>
                          )}
                          {log.dispatcherAgreed === null && (
                            <span className="text-zinc-500 text-[10px]">Pending Eval</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isEvaluated ? (
                            <span className="text-zinc-600 text-[10px]">Evaluated</span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleEvaluateLog(log.id, log.predictedUrgency)}
                                className="px-2 py-0.5 text-[10px] rounded border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-colors"
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
                                className="px-1.5 py-0.5 text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Override...
                                </option>
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="EMERGENCY">EMERGENCY</option>
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
