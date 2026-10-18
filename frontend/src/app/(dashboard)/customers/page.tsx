'use client';

import {
  AlertCircle,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { CreateOrderModal } from '../../../components/CreateOrderModal';
import { CustomerModal } from '../../../components/CustomerModal';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import type { Customer, WorkOrder } from '../../../types';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [_selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.customers.list(search.trim() || undefined);
      setCustomers(data);
    } catch {
      setError('Unable to load customer directory.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerSaved = (savedCust: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === savedCust.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCust.id ? savedCust : c));
      }
      return [savedCust, ...prev];
    });
    setCustomerToEdit(null);
  };

  const handleOrderCreated = (_newOrder: WorkOrder) => {
    setIsOrderModalOpen(false);
    fetchCustomers();
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Customer Accounts</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Commercial facility accounts, service locations, and client contacts
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchCustomers()}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#151923] border border-[#202634] rounded-lg transition-colors cursor-pointer"
              title="Refresh directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Customer
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, contact person, city, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#202634] bg-[#10131a] text-slate-100 pl-9 pr-3.5 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Loading customer directory...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 rounded-xl border border-[#1e2432] bg-[#11141c] text-center text-slate-400 space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <span className="font-semibold text-slate-200 block text-sm">
              No customer accounts found
            </span>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'Try adjusting your search criteria or check for typos.'
                : 'Get started by creating your first customer account.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              + Add New Customer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((cust) => (
              <div
                key={cust.id}
                className="rounded-xl border border-[#1e2432] bg-[#11141c] p-5 space-y-4 hover:border-blue-500/40 transition-colors flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">
                        {cust.companyName || cust.name}
                      </h3>
                      {cust.companyName && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{cust.name}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50 shrink-0">
                      #{cust.id}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-[#1b202c]">
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {cust.address}, {cust.city}
                        {cust.postalCode ? ` ${cust.postalCode}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>

                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1b202c] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cust._count?.workOrders || 0} work orders</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {user?.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerToEdit(cust);
                          setIsCustomerModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit customer account (Admin only)"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerForOrder(cust);
                        setIsOrderModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      + New Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setCustomerToEdit(null);
          }}
          onCreated={handleCustomerSaved}
          customerToEdit={customerToEdit}
        />

        <CreateOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedCustomerForOrder(null);
          }}
          onCreated={handleOrderCreated}
        />
      </div>
    </ProtectedRoute>
  );
}
