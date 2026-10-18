'use client';

import { AlertCircle, ArrowRight, ChevronRight, Lock, Mail, Wrench } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface DemoUser {
  role: 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';
  name: string;
  title: string;
  email: string;
  password: string;
  description: string;
  badgeStyle: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    role: 'ADMIN',
    name: 'Sarah Jenkins',
    title: 'Operations Director',
    email: 'admin@fieldops.local',
    password: 'AdminPass123!',
    description: 'System administration, customer accounts & financial rate configuration',
    badgeStyle: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
  },
  {
    role: 'DISPATCHER',
    name: 'David Miller',
    title: 'Lead Dispatcher',
    email: 'dispatcher@fieldops.local',
    password: 'DispatchPass123!',
    description: 'Job queue management, intelligent triage & technician scheduling',
    badgeStyle: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
  },
  {
    role: 'TECHNICIAN',
    name: 'Mike Torres',
    title: 'Senior Field Technician',
    email: 'tech.mike@fieldops.local',
    password: 'TechPass123!',
    description: 'On-site execution, status progression & trade line-item recording',
    badgeStyle: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
  },
];

function LoginFormContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = searchParams.get('from') || '/work-orders';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.auth.login(email, password);
      login(res.token, res.user);
      router.replace(from);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demo: DemoUser) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.auth.login(demo.email, demo.password);
      login(res.token, res.user);
      router.replace(from);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#12151c] border border-[#202634] shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-9.5 pr-3.5 py-2.5 text-sm rounded-lg border border-[#232b3b] bg-[#090b10] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9.5 pr-3.5 py-2.5 text-sm rounded-lg border border-[#232b3b] bg-[#090b10] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-5 border-t border-[#1e2432] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Quick demo personas</span>
          <span className="text-[11px] text-slate-400">One-click sign-in</span>
        </div>

        <div className="space-y-2">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.role}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin(demo)}
              className="w-full text-left p-3 rounded-xl border border-[#1f2533] bg-[#0a0c10] hover:border-blue-500/40 hover:bg-[#131722] transition-all group flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                  {demo.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                      {demo.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full border ${demo.badgeStyle}`}
                    >
                      {demo.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{demo.description}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#090b0e] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <Wrench className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to FieldOps</h1>
        <p className="text-sm text-slate-400">
          Field service dispatch and job lifecycle operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-[#12151c] border border-[#202634] p-8 text-center text-slate-400 text-sm rounded-2xl">
              Loading workspace...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
