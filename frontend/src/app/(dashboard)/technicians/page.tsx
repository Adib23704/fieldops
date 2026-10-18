'use client';

import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { TechnicianModal } from '../../../components/TechnicianModal';
import { useAuth } from '../../../context/AuthContext';
import type { Technician } from '../../../types';

const TRADE_CATEGORIES = ['ALL', 'HVAC', 'ELECTRICAL', 'PLUMBING', 'REFRIGERATION', 'APPLIANCE'];

export default function TechniciansPage() {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [technicianToEdit, setTechnicianToEdit] = useState<Technician | null>(null);

  const fetchTechnicians = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.technicians.list(includeInactive);
      setTechnicians(data);
    } catch {
      setError('Unable to load technician directory.');
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleTechnicianSaved = (savedTech: Technician) => {
    setTechnicians((prev) => {
      const exists = prev.some((t) => t.id === savedTech.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTech.id ? savedTech : t));
      }
      return [...prev, savedTech];
    });
    setTechnicianToEdit(null);
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tech.fullName.toLowerCase().includes(q) ||
      tech.email.toLowerCase().includes(q) ||
      Boolean(tech.phone?.includes(q)) ||
      tech.skillCategories.some((s) => s.toLowerCase().includes(q));

    const matchesTrade =
      selectedTrade === 'ALL' ||
      tech.skillCategories.some((s) => s.toUpperCase() === selectedTrade.toUpperCase());

    return matchesSearch && matchesTrade;
  });

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Technician Roster
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Field technician dispatch credentials, trade competencies, and live workloads
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchTechnicians()}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#151923] border border-[#202634] rounded-lg transition-colors cursor-pointer"
              title="Refresh roster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setTechnicianToEdit(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Technician
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technicians by name, email, phone, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 pl-9 pr-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {TRADE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedTrade(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selectedTrade === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#121620] text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] border border-[#202634]'
                  }`}
                >
                  {cat === 'ALL' ? 'All Trades' : cat}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none pl-2 border-l border-[#202634]">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
              />
              <span>Show Inactive</span>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Loading technician roster...</span>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-[#202634] bg-[#0c0e14]/50 space-y-2">
            <Shield className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
            <span className="text-sm font-medium text-slate-300 block">No technicians found</span>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedTrade !== 'ALL'
                ? 'Try adjusting your search criteria or skill trade filter.'
                : 'Get started by registering your first field service technician.'}
            </p>
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setTechnicianToEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                + Add New Technician
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTechnicians.map((tech) => (
              <div
                key={tech.id}
                className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-4 hover:border-blue-500/40 transition-colors flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-2">
                        {tech.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            tech.role === 'ADMIN'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                          }`}
                        >
                          {tech.role}
                        </span>
                        {tech.isActive ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50 shrink-0">
                      #{tech.id}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-[#1b202c]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{tech.phone || 'No phone recorded'}</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                        Certified Trades & Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.skillCategories.length > 0 ? (
                          tech.skillCategories.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-950/50 text-blue-300 border border-blue-800/40"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            General Trade / No skills tagged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1b202c] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span
                      className={
                        tech.activeOrdersCount > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'
                      }
                    >
                      {tech.activeOrdersCount === 0
                        ? 'Available / Idle'
                        : `${tech.activeOrdersCount} active job${tech.activeOrdersCount > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {user?.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTechnicianToEdit(tech);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit technician details (Admin only)"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <TechnicianModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTechnicianToEdit(null);
          }}
          onSaved={handleTechnicianSaved}
          technicianToEdit={technicianToEdit}
        />
      </div>
    </ProtectedRoute>
  );
}
