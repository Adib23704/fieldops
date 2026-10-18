'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';

export default function TriageStudioPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">AI Triage Studio</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Dual-engine triage inference, telemetry metrics, and human evaluation loop.
        </p>
      </div>
    </ProtectedRoute>
  );
}
