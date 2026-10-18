'use client';

import { AlertCircle, Lock, Plus, Receipt, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { api } from '../api/client';
import type { ItemType, WorkOrder, WorkOrderItem } from '../types';

interface LineItemsEditorProps {
  order: WorkOrder;
  onOrderUpdated: (updatedOrder: WorkOrder) => void;
  canEdit: boolean;
}

export const LineItemsEditor: React.FC<LineItemsEditorProps> = ({
  order,
  onOrderUpdated,
  canEdit,
}) => {
  const [items, setItems] = useState<WorkOrderItem[]>(order.items || []);
  const [subtotal, setSubtotal] = useState<number | string>(order.subtotal);
  const [taxAmount, setTaxAmount] = useState<number | string>(order.taxAmount);
  const [totalAmount, setTotalAmount] = useState<number | string>(order.totalAmount);

  const [type, setType] = useState<ItemType>('PART');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = order.status === 'COMPLETED';
  const isEditable = canEdit && !isCompleted;
  const hasLabor = items.some((i) => i.type === 'LABOR');

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !description.trim() ||
      !quantity ||
      Number(quantity) <= 0 ||
      unitPrice === '' ||
      Number(unitPrice) < 0
    ) {
      setError('Please provide a valid description, quantity, and unit cost.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.workOrders.addItem(order.id, {
        type,
        description: description.trim(),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      });

      const updatedItems = [...items, res.item];
      setItems(updatedItems);
      setSubtotal(res.totals.subtotal);
      setTaxAmount(res.totals.taxAmount);
      setTotalAmount(res.totals.totalAmount);

      onOrderUpdated({
        ...order,
        items: updatedItems,
        subtotal: res.totals.subtotal,
        taxAmount: res.totals.taxAmount,
        totalAmount: res.totals.totalAmount,
      });

      setDescription('');
      setQuantity(1);
      setUnitPrice('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to record line item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Remove this line item from the invoice?')) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.workOrders.deleteItem(order.id, itemId);
      const updatedItems = items.filter((i) => i.id !== itemId);
      setItems(updatedItems);
      setSubtotal(res.totals.subtotal);
      setTaxAmount(res.totals.taxAmount);
      setTotalAmount(res.totals.totalAmount);

      onOrderUpdated({
        ...order,
        items: updatedItems,
        subtotal: res.totals.subtotal,
        taxAmount: res.totals.taxAmount,
        totalAmount: res.totals.totalAmount,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `$${(num || 0).toFixed(2)}`;
  };

  return (
    <div className="rounded-xl border border-[#1e2432] bg-[#11141c] p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#1f2533]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Labor & Materials Ledger</h3>
            <p className="text-xs text-slate-400">
              Itemized service parts, on-site labor hours, and pricing calculations
            </p>
          </div>
        </div>

        {isCompleted && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
            <Lock className="w-3 h-3 text-slate-400" />
            Invoice Finalized
          </span>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!hasLabor && !isCompleted && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Notice: At least 1 labor entry is required by the pricing engine before completing this
            work order.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#1d222e]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0c0e14] border-b border-[#1d222e] text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-2.5 px-3">
                Type
              </th>
              <th scope="col" className="py-2.5 px-3">
                Description
              </th>
              <th scope="col" className="py-2.5 px-3 text-right">
                Qty / Hrs
              </th>
              <th scope="col" className="py-2.5 px-3 text-right">
                Rate
              </th>
              <th scope="col" className="py-2.5 px-3 text-right">
                Total
              </th>
              {isEditable && (
                <th scope="col" className="py-2.5 px-3 text-right w-12">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b202c]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={isEditable ? 6 : 5} className="py-8 text-center text-slate-500">
                  No line items logged yet. Add labor or replacement parts below.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-[#151923] transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        item.type === 'LABOR'
                          ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                      }`}
                    >
                      {item.type === 'LABOR' ? 'Labor' : 'Part'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-medium">{item.description}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-100">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  {isEditable && (
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isSubmitting}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditable && (
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-xl border border-[#1f2533] bg-[#0c0e14] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Add Line Item</span>
            <span className="text-[11px] text-slate-500">Record parts or technician hours</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-full text-xs rounded-lg border border-[#232b3b] bg-[#12151c] text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PART">Part / Material</option>
                <option value="LABOR">Labor Hours</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <input
                type="text"
                required
                placeholder={
                  type === 'LABOR' ? 'e.g. Diagnostic & system repair' : 'e.g. 40A Contactor relay'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#232b3b] bg-[#12151c] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="Qty / Hrs"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs rounded-lg border border-[#232b3b] bg-[#12151c] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Unit rate ($)"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs rounded-lg border border-[#232b3b] bg-[#12151c] text-slate-200 px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-full min-h-8.5 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
                title="Add to ledger"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-72 p-4 rounded-xl border border-[#1d222e] bg-[#0c0e14] space-y-2.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sales Tax (8.25%)</span>
            <span className="font-mono text-slate-200">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="pt-2.5 border-t border-[#1d222e] flex justify-between text-sm font-semibold text-slate-100">
            <span>Total Balance</span>
            <span className="font-mono text-emerald-400">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
