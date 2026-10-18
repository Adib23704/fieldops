'use client';

import {
  AlertCircle,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { CreateOrderModal } from '../../../components/CreateOrderModal';
import { CustomerModal } from '../../../components/CustomerModal';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import type { Customer } from '../../../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.customers.list(search.trim() || undefined);
      setCustomers(data);
    } catch {
      setError('Failed to fetch customers.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerCreated = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Customer Directory</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Commercial client accounts, physical facility sites, and dispatch contact directory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchCustomers()}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-700 rounded transition-colors"
              title="Refresh Customers"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by company name, contact, city, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded border border-zinc-800 bg-zinc-900 text-zinc-100 pl-9 pr-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
            <span>Loading accounts...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 rounded border border-zinc-800 bg-zinc-900/40 text-center text-zinc-500 space-y-2">
            <Building2 className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
            <span className="text-xs font-mono block">
              No customer accounts matched your search.
            </span>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="text-xs text-amber-400 hover:underline font-mono"
            >
              + Register customer account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((cust) => (
              <div
                key={cust.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {cust.companyName || cust.name}
                      </h3>
                      {cust.companyName && (
                        <span className="text-xs text-zinc-400 block items-center gap-1.5">
                          <User className="w-3 h-3 text-zinc-500" /> {cust.name}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      ID #{cust.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>
                        {cust.address}, {cust.city} {cust.postalCode || ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-mono">{cust.phone}</span>
                    </div>

                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{cust._count?.workOrders || 0} Service Orders</span>
                  </div>

                  <Link
                    href={`/work-orders?search=${encodeURIComponent(cust.companyName || cust.name)}`}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    View Jobs
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onCreated={handleCustomerCreated}
        />

        <CreateOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onCreated={() => {
            fetchCustomers();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
