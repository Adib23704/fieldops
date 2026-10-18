'use client';

import { useParams } from 'next/navigation';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-100">Work Order #{id}</h1>
      <p className="text-xs text-zinc-400 mt-1">Lifecycle execution and pricing editor.</p>
    </div>
  );
}
