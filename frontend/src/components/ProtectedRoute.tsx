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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-wider font-mono">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-300 p-6">
        <div className="max-w-md w-full border border-zinc-800 bg-zinc-900/60 p-6 rounded-lg text-center">
          <div className="inline-flex p-3 rounded-full bg-red-950/50 border border-red-800/60 text-red-400 mb-4 font-mono text-sm">
            403_ACCESS_FORBIDDEN
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Insufficient Permissions</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Your role (<span className="font-mono text-amber-400 font-semibold">{user.role}</span>)
            does not have access to this operational view.
          </p>
          <Link
            href="/work-orders"
            className="inline-block px-4 py-2 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            Return to Work Orders
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
