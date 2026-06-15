"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Category, TransactionWithCategory, TxType } from "@/lib/types";
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/app/actions/transactions";

function todayString(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function TransactionForm({
  open,
  onClose,
  categories,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing: TransactionWithCategory | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // This component is only mounted while open (see DashboardClient), so initial
  // state can be derived directly from `editing` — no reset effect needed.
  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [categoryId, setCategoryId] = useState<string>(
    editing?.category_id ?? "",
  );
  const [date, setDate] = useState(editing?.occurred_on ?? todayString());
  const [note, setNote] = useState(editing?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  // Categories selectable for the chosen type: active ones, plus the currently
  // assigned (possibly archived) category when editing.
  const options = categories.filter(
    (c) => c.type === type && (!c.is_archived || c.id === editing?.category_id),
  );

  // Derive the effective selection so a category that no longer matches the
  // chosen type falls back to "Uncategorized" without a state-syncing effect.
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
    const input = {
      type,
      amount: amt,
      category_id: effectiveCategoryId || null,
      occurred_on: date,
      note: note.trim() || null,
    };
    setError(null);
    startTransition(async () => {
      const res = editing
        ? await updateTransaction(editing.id, input)
        : await addTransaction(input);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm("Delete this transaction?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTransaction(editing.id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add transaction"}
    >
      <form onSubmit={submit}>
        {/* Type toggle */}
        <div className="mb-4 inline-flex rounded-xl border border-border p-1">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg px-4 py-1.5 text-sm capitalize transition-colors ${
                type === t
                  ? t === "income"
                    ? "bg-positive text-white"
                    : "bg-negative text-white"
                  : "text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

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

        <label className="mb-1.5 block text-sm text-muted">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-text py-2.5 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {editing ? "Save changes" : "Add transaction"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Delete transaction"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted hover:text-negative disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
