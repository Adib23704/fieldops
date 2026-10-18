'use client';

import type React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0d0f14] text-slate-100 flex flex-col lg:flex-row font-sans antialiased">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
