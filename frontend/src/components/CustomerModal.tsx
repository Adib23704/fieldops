'use client';

import { AlertCircle, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { api } from '../api/client';
import type { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Austin');
  const [postalCode, setPostalCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError('Contact person, phone, address, and city are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await api.customers.create({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
      });

      onCreated(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create customer record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-[#11141c] border border-[#202634] rounded-2xl max-w-lg w-full shadow-2xl p-6 z-10 space-y-5">
        <div className="flex items-start justify-between pb-4 border-b border-[#1f2533]">
          <div>
            <h2 className="text-base font-semibold text-slate-100">New Customer Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a commercial facility or residential service account
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a1f2c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="company" className="block text-xs font-medium text-slate-300 mb-1.5">
                Facility / Company Name
              </label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Austin Regional Hospital"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Person *
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Robert Keller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Phone *
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="(512) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="facilities@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-xs font-medium text-slate-300 mb-1.5">
              Service Street Address *
            </label>
            <input
              id="address"
              type="text"
              required
              placeholder="e.g. 1400 Congress Ave, Suite 300"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-xs font-medium text-slate-300 mb-1.5">
                City *
              </label>
              <input
                id="city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="zip" className="block text-xs font-medium text-slate-300 mb-1.5">
                Postal Code
              </label>
              <input
                id="zip"
                type="text"
                placeholder="78701"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f2533] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151923] border border-[#202634] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
