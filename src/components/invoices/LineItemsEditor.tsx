'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatIDR } from '@/lib/utils';
import type { InvoiceItem } from '@/types/invoice';

interface LineItemsEditorProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  tax: number;
  discount: number;
  onTaxChange: (v: number) => void;
  onDiscountChange: (v: number) => void;
}

export function LineItemsEditor({
  items,
  onChange,
  tax,
  discount,
  onTaxChange,
  onDiscountChange,
}: LineItemsEditorProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;

  const updateItem = useCallback(
    (index: number, field: keyof InvoiceItem, rawValue: string) => {
      const next = items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item };
        if (field === 'description') {
          updated.description = rawValue;
        } else {
          const num = Number(rawValue);
          updated[field] = isNaN(num) ? 0 : num;
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total =
              (field === 'quantity' ? num : item.quantity) *
              (field === 'unitPrice' ? num : item.unitPrice);
          }
        }
        return updated;
      });
      onChange(next);
    },
    [items, onChange],
  );

  const addRow = () =>
    onChange([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Table */}
      <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-base)]">
              <th className="text-left px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-full">
                Description
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-20">
                Qty
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-32">
                Unit Price
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-32">
                Total
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <td className="px-3 py-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="e.g. Website Design"
                    className="border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 text-[var(--text-primary)]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full text-right border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="0"
                    className="w-full text-right border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
                <td className="px-3 py-2 text-right text-[var(--text-secondary)] font-medium tabular-nums">
                  {formatIDR(item.total)}
                </td>
                <td className="px-1 py-2">
                  <button
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 transition-all disabled:opacity-0 disabled:cursor-not-allowed',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addRow}
        className="self-start text-[var(--text-secondary)]"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Item
      </Button>

      {/* Totals */}
      <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4 mt-auto">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal</span>
          <span className="text-[var(--text-primary)] font-medium tabular-nums">
            {formatIDR(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm gap-4">
          <span className="text-[var(--text-secondary)] w-20 shrink-0">Tax (IDR)</span>
          <Input
            type="number"
            min={0}
            value={tax}
            onChange={(e) => onTaxChange(Number(e.target.value) || 0)}
            className="w-36 text-right tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between text-sm gap-4">
          <span className="text-[var(--text-secondary)] w-20 shrink-0">Discount (IDR)</span>
          <Input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className="w-36 text-right tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between text-base font-semibold border-t border-[var(--border-default)] pt-3 mt-1">
          <span className="text-[var(--text-primary)]">Total</span>
          <span className="tabular-nums text-[var(--status-success)]">{formatIDR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
