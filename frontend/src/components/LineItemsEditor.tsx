'use client';

import { AlertCircle, DollarSign, Lock, Plus, Trash2 } from 'lucide-react';
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
      setError('Please provide valid description, positive quantity, and non-negative unit price.');
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
        setError('Failed to add line item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this line item?')) return;

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
        setError('Failed to remove item.');
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Billable Items & Pricing Engine</h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Tax Rate: 8.25% (Standard Field Services)
        </span>
      </div>

      {!hasLabor && !isCompleted && (
        <div className="p-3 rounded bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Notice: At least 1 <strong className="font-mono">LABOR</strong> item must be logged
            before this work order can transition to COMPLETED.
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2 font-mono">
          <Lock className="w-4 h-4 shrink-0 text-zinc-500" />
          <span>Order completed. Financial line items are locked from modifications.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              {isEditable && <th className="py-2.5 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={isEditable ? 6 : 5}
                  className="py-8 text-center text-zinc-500 font-mono text-xs"
                >
                  No items logged yet. Add parts or labor hours below.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${
                        item.type === 'LABOR'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200 font-medium">{item.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                    {Number(item.quantity).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-zinc-100">
                    {formatCurrency(item.totalPrice)}
                  </td>
                  {isEditable && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Delete Item"
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

      <div className="flex justify-end">
        <div className="w-full sm:w-72 p-3.5 rounded border border-zinc-800 bg-zinc-950/80 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span className="font-mono text-zinc-200">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Sales Tax (8.25%)</span>
            <span className="font-mono text-zinc-200">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-zinc-100 pt-2 border-t border-zinc-800">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Total Due
            </span>
            <span className="font-mono text-emerald-400 text-sm">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {isEditable && (
        <form onSubmit={handleAddItem} className="pt-4 border-t border-zinc-800 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
            Add Billable Part or Labor Hours
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="PART">PART</option>
                <option value="LABOR">LABOR</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <input
                type="text"
                required
                placeholder="Description (e.g. 1.5 HP Condenser Fan Motor)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-3 py-1.5 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Qty"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-2.5 py-1.5 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-right font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Price ($)"
                value={unitPrice}
                onChange={(e) =>
                  setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-100 px-2.5 py-1.5 placeholder-zinc-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-right font-mono"
              />
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 transition-colors"
                title="Add Item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
