'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b0e] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 border-2 border-[#232a36] border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-slate-400">
            AUTHENTICATING OPERATOR...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090b0e] text-slate-300 p-6 font-mono">
        <div className="max-w-md w-full border border-[#232a36] bg-[#0e1217] p-6 rounded-[3px] text-center space-y-4">
          <div className="inline-flex px-2 py-1 rounded-[1px] bg-[#240e12] border border-[#521b24] text-red-400 text-xs font-bold">
            403 {'//'} INSUFFICIENT AUTHORIZATION
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-100 uppercase">Access Denied</h2>
            <p className="text-xs text-slate-400 font-sans">
              Role [<span className="text-amber-400 font-mono font-bold">{user.role}</span>] is not
              cleared for this dispatch view.
            </p>
          </div>
          <Link
            href="/work-orders"
            className="inline-block px-3 py-1.5 text-xs font-bold uppercase rounded-[2px] border border-[#232a36] bg-[#141922] text-slate-200 hover:bg-[#1a212d] transition-colors"
          >
            Return to Master Queue
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
