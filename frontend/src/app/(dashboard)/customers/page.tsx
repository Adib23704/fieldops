'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';

export default function CustomersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Customer Directory</h1>
        <p className="text-xs text-zinc-400 mt-1">Commercial client accounts and service sites.</p>
      </div>
    </ProtectedRoute>
  );
}
