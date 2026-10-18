'use client';

import { AlertCircle, ArrowRight, KeyRound, Lock, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { Suspense, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface DemoUser {
  role: 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';
  label: string;
  name: string;
  email: string;
  password: string;
  description: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    role: 'ADMIN',
    label: 'Administrator',
    name: 'Sarah Jenkins',
    email: 'admin@fieldops.local',
    password: 'AdminPass123!',
    description: 'Full system control, pricing audit logs, customers, user oversight',
  },
  {
    role: 'DISPATCHER',
    label: 'Lead Dispatcher',
    name: 'David Miller',
    email: 'dispatcher@fieldops.local',
    password: 'DispatchPass123!',
    description: 'Intake triage, order scheduling, technician assignments, conflict validation',
  },
  {
    role: 'TECHNICIAN',
    label: 'Field Tech (HVAC)',
    name: 'Mike Torres',
    email: 'tech.mike@fieldops.local',
    password: 'TechPass123!',
    description: 'Assigned job execution, parts usage logging, status progression',
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
        setError('Authentication failed. Please check your credentials.');
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
        setError('Quick login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 py-8 px-6 shadow-xl rounded-lg sm:px-8">
      {error && (
        <div className="mb-6 p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1">
            Email Address
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@fieldops.local"
              className="block w-full pl-9 pr-3 py-2 text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1">
            Password
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-9 pr-3 py-2 text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-amber-600/80 rounded shadow-sm text-xs font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors mt-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-amber-500" />
            Evaluator Quick Roles
          </span>
          <span className="text-[10px] text-zinc-500">1-Click Auto Login</span>
        </div>

        <div className="space-y-2">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.role}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin(demo)}
              className="w-full text-left p-2.5 rounded border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors group flex items-start justify-between"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                    {demo.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {demo.role}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">{demo.description}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <span className="font-mono text-base font-bold">FO</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-100">FieldOps</span>
        </div>
        <h2 className="text-center text-sm font-medium text-zinc-400">
          Field Service Dispatch & Job Lifecycle Engine
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-zinc-900/70 border border-zinc-800 p-8 rounded-lg text-center text-zinc-400 text-xs font-mono">
              Loading authentication...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-zinc-600 font-mono">
            JWT RBAC &bull; Prisma 7 &bull; PostgreSQL &bull; Dual-Engine AI Triage
          </p>
        </div>
      </div>
    </div>
  );
}
