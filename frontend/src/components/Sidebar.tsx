'use client';

import { Building2, ClipboardList, LogOut, Menu, Sparkles, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isLinkActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleLabels: Record<string, { label: string; badge: string }> = {
    ADMIN: {
      label: 'Admin',
      badge: 'bg-purple-950/60 text-purple-300 border border-purple-800/40',
    },
    DISPATCHER: {
      label: 'Dispatcher',
      badge: 'bg-blue-950/60 text-blue-300 border border-blue-800/40',
    },
    TECHNICIAN: {
      label: 'Technician',
      badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40',
    },
  };

  const roleMeta = roleLabels[user.role] || {
    label: user.role,
    badge: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  };

  const navLinks = [
    {
      href: '/work-orders',
      label: 'Work Orders',
      icon: ClipboardList,
      roles: ['ADMIN', 'DISPATCHER', 'TECHNICIAN'],
    },
    {
      href: '/customers',
      label: 'Customers',
      icon: Building2,
      roles: ['ADMIN', 'DISPATCHER'],
    },
    {
      href: '/triage',
      label: 'AI Triage',
      icon: Sparkles,
      roles: ['ADMIN', 'DISPATCHER'],
    },
  ];

  const allowedNav = navLinks.filter((item) => item.roles.includes(user.role));

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0a0c10] border-r border-[#1b202c]">
      <div className="p-4 border-b border-[#1b202c]">
        <Link
          href="/work-orders"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-100 tracking-tight">FieldOps</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-950/70 text-blue-300 border border-blue-800/40">
                PRO
              </span>
            </div>
            <span className="text-xs text-slate-400">Dispatch & Operations</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          Operations
        </div>
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141822]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-4 py-3 mx-3 mb-2 rounded-lg bg-[#11141c] border border-[#1b202c]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-slate-300">Dispatch Online</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Dual-engine triage & conflict-free scheduling active
        </p>
      </div>

      <div className="p-3 border-t border-[#1b202c] bg-[#0d0f15]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate">{user.fullName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${roleMeta.badge}`}
                >
                  {roleMeta.label}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-[#0a0c10] border-b border-[#1b202c] sticky top-0 z-40">
        <Link href="/work-orders" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-slate-100">FieldOps</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#141822] rounded-lg"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-64 max-w-xs flex-1 flex flex-col z-10 shadow-2xl">
            <NavContent />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 z-30">
        <NavContent />
      </aside>
    </>
  );
};
