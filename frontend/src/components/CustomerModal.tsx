'use client';

import { AlertCircle, Building2, X } from 'lucide-react';
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
      setError('Name, phone, address, and city are required.');
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
        setError('Failed to create customer account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
      />

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Add Customer Account</h2>
              <p className="text-[11px] text-zinc-400">
                Register facility site and point-of-contact details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="companyNameInput"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Company / Facility Name
              </label>
              <input
                id="companyNameInput"
                type="text"
                placeholder="e.g. Harbor Bistro & Bar"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="contactNameInput"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Primary Contact Name *
              </label>
              <input
                id="contactNameInput"
                type="text"
                required
                placeholder="e.g. Elena Rostova"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phoneInput" className="block text-xs font-medium text-zinc-300 mb-1">
                Phone Number *
              </label>
              <input
                id="phoneInput"
                type="tel"
                required
                placeholder="(512) 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label htmlFor="emailInput" className="block text-xs font-medium text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                id="emailInput"
                type="email"
                placeholder="manager@harborbistro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="addressInput" className="block text-xs font-medium text-zinc-300 mb-1">
              Site Address *
            </label>
            <input
              id="addressInput"
              type="text"
              required
              placeholder="3800 Lake Austin Blvd"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cityInput" className="block text-xs font-medium text-zinc-300 mb-1">
                City *
              </label>
              <input
                id="cityInput"
                type="text"
                required
                placeholder="Austin"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="postalCodeInput"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Postal Code
              </label>
              <input
                id="postalCodeInput"
                type="text"
                placeholder="78703"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-2 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
