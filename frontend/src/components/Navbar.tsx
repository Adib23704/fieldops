'use client';

import { Bot, ClipboardList, LogOut, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleBadgeStyles: Record<string, string> = {
    ADMIN: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    DISPATCHER: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    TECHNICIAN: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  };

  const isLinkActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/work-orders" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                <span className="font-mono text-sm font-bold">FO</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-2">
                  FieldOps
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                    v1.0
                  </span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM ACTIVE
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/work-orders"
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isLinkActive('/work-orders')
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Work Orders
              </Link>

              {user.role !== 'TECHNICIAN' && (
                <>
                  <Link
                    href="/customers"
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isLinkActive('/customers')
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Customers
                  </Link>

                  <Link
                    href="/triage"
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isLinkActive('/triage')
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    AI Triage Studio
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-zinc-200">{user.fullName}</div>
                <div className="text-[10px] text-zinc-400 font-mono truncate max-w-35">
                  {user.email}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                  roleBadgeStyles[user.role] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                <Shield className="w-2.5 h-2.5" />
                {user.role}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
