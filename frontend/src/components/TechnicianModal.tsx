'use client';

import { AlertCircle, Check, Shield, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Technician } from '../types';

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (technician: Technician) => void;
  technicianToEdit?: Technician | null;
}

const AVAILABLE_SKILLS = ['HVAC', 'ELECTRICAL', 'PLUMBING', 'REFRIGERATION', 'APPLIANCE'];

export const TechnicianModal: React.FC<TechnicianModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  technicianToEdit,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (technicianToEdit) {
        setFullName(technicianToEdit.fullName || '');
        setEmail(technicianToEdit.email || '');
        setPhone(technicianToEdit.phone || '');
        setPassword('');
        setSelectedSkills(technicianToEdit.skillCategories || []);
        setIsActive(technicianToEdit.isActive !== false);
      } else {
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setSelectedSkills(['HVAC']);
        setIsActive(true);
      }
      setError(null);
    }
  }, [technicianToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setError('Full name, email, and primary phone are required.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!technicianToEdit && (!password || password.length < 6)) {
      setError('Initial password must be at least 6 characters long.');
      return;
    }

    if (technicianToEdit && password && password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (technicianToEdit) {
        const payload: {
          fullName: string;
          email: string;
          phone: string;
          skillCategories: string[];
          isActive: boolean;
          password?: string;
        } = {
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          skillCategories: selectedSkills,
          isActive,
        };
        if (password) {
          payload.password = password;
        }

        const updated = await api.technicians.update(technicianToEdit.id, payload);
        onSaved(updated);
      } else {
        const created = await api.technicians.create({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password,
          skillCategories: selectedSkills,
          isActive,
        });
        onSaved(created);
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          technicianToEdit
            ? 'Failed to update technician record.'
            : 'Failed to create technician record.'
        );
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

      <div className="relative bg-[#11141c] border border-[#202634] rounded-2xl w-full max-w-lg p-6 shadow-2xl z-10 space-y-5 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#1d222e]">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              {technicianToEdit ? 'Edit Technician Profile' : 'Add New Technician'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {technicianToEdit
                ? 'Update contact details, trade competencies, and account access status.'
                : 'Create field technician credentials, phone contacts, and certified trade skills.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="e.g. Marcus Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Phone *
              </label>
              <input
                id="phone"
                type="text"
                required
                placeholder="(512) 555-0188"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Login Email *
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="tech.name@fieldops.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                {technicianToEdit ? 'New Password (Optional)' : 'Initial Password *'}
              </label>
              <input
                id="password"
                type="password"
                required={!technicianToEdit}
                placeholder={technicianToEdit ? 'Leave blank to keep' : 'Min 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#202634] bg-[#0c0e14] text-slate-200 px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-300 mb-2">
              Certified Trade Skills (Used for AI Matching)
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'bg-[#151923] border-[#222836] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {technicianToEdit && (
            <div className="pt-2 border-t border-[#1d222e] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-300 block">Account Status</span>
                <span className="text-[11px] text-slate-500">
                  Deactivated technicians cannot log in or be assigned new work orders.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-800/40 text-red-300'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-[#1d222e] flex items-center justify-end gap-2.5">
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
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors shadow-sm shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : technicianToEdit
                    ? 'Save Changes'
                    : 'Create Technician'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
