"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import type {
  Category,
  RecurringFrequency,
  RecurringTransaction,
  TxType,
} from "@/lib/types";
import { updateRecurring } from "@/app/actions/recurring";

export function RecurringForm({
  open,
  onClose,
  categories,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing: RecurringTransaction;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const type: TxType = editing.type;
  const [amount, setAmount] = useState(String(editing.amount));
  const [categoryId, setCategoryId] = useState<string>(
    editing.category_id ?? "",
  );
  const [note, setNote] = useState(editing.note ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    editing.frequency,
  );
  const [endDate, setEndDate] = useState(editing.end_date ?? "");
  const [error, setError] = useState<string | null>(null);

  // Match TransactionForm behaviour: show categories of the same type, plus
  // the currently-assigned one even if archived.
  const options = categories.filter(
    (c) =>
      c.type === type && (!c.is_archived || c.id === editing.category_id),
  );
  const effectiveCategoryId = options.some((c) => c.id === categoryId)
    ? categoryId
    : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Math.round(parseFloat(amount) * 100) / 100;
    if (!Number.isFinite(amt) || amt < 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (endDate && endDate < editing.start_date) {
      setError("End date must be after the start date.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateRecurring(editing.id, {
        type,
        amount: amt,
        category_id: effectiveCategoryId || null,
        note: note.trim() || null,
        frequency,
        start_date: editing.start_date,
        end_date: endDate || null,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit recurring rule">
      <form onSubmit={submit}>
        <p className="mb-4 text-xs text-muted">
          Changes apply to future occurrences only. Past transactions this rule
          created are left as-is.
        </p>

        <label className="mb-1.5 block text-sm text-muted">Amount</label>
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            $
          </span>
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="tnum w-full rounded-xl border border-border bg-page py-2.5 pl-7 pr-3 text-lg outline-none focus:border-text/30"
          />
        </div>

        <label className="mb-1.5 block text-sm text-muted">Category</label>
        <select
          value={effectiveCategoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30"
        >
          <option value="">Uncategorized</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.is_archived ? " (archived)" : ""}
            </option>
          ))}
        </select>

        <label className="mb-1.5 block text-sm text-muted">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          className="mb-4 w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <label className="mb-1.5 block text-sm text-muted">
          Ends on (optional)
        </label>
        <input
          type="date"
          value={endDate}
          min={editing.start_date}
          onChange={(e) => setEndDate(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30"
        />

        <label className="mb-1.5 block text-sm text-muted">Note</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="optional"
          className="mb-5 w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30"
        />

        {error && <p className="mb-4 text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-text py-2.5 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Save changes
        </button>
      </form>
    </Modal>
  );
}
