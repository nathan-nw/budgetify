"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ColorPicker } from "@/components/ColorPicker";
import { PALETTE } from "@/lib/colors";
import type { Category, TxType } from "@/lib/types";
import {
  addCategory,
  setCategoryArchived,
  updateCategory,
} from "@/app/actions/categories";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TxType>("expense");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PALETTE[0]);

  const active = categories.filter((c) => !c.is_archived);
  const archived = categories.filter((c) => c.is_archived);
  const income = active.filter((c) => c.type === "income");
  const expense = active.filter((c) => c.type === "expense");

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        setError(res.error);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    run(
      () => addCategory({ name: newName, type: newType, color: newColor }),
      () => {
        setNewName("");
        setNewColor(PALETTE[0]);
        setAdding(false);
      },
    );
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
    setError(null);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    run(
      () => updateCategory(editingId, { name: editName, color: editColor }),
      () => setEditingId(null),
    );
  }

  function renderRow(c: Category, archivedRow = false) {
    if (editingId === c.id) {
      return (
        <form
          key={c.id}
          onSubmit={submitEdit}
          className="rounded-xl border border-border p-3"
        >
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            className="mb-3 w-full rounded-lg border border-border bg-page px-3 py-2 text-sm outline-none focus:border-text/30"
          />
          <div className="mb-3">
            <ColorPicker value={editColor} onChange={setEditColor} />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-text px-3 py-1.5 text-sm font-medium text-page disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    return (
      <div
        key={c.id}
        className="flex items-center justify-between gap-3 rounded-xl px-1 py-2"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: c.color }}
          />
          <span className="text-sm">{c.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {archivedRow ? (
            <button
              type="button"
              onClick={() => run(() => setCategoryArchived(c.id, false))}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:text-text"
            >
              <RotateCcw size={14} /> Restore
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => startEdit(c)}
                aria-label={`Edit ${c.name}`}
                className="rounded-lg p-1.5 text-muted hover:text-text"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Archive "${c.name}"? It will be hidden from new transactions but its past transactions keep their color.`,
                    )
                  ) {
                    run(() => setCategoryArchived(c.id, true));
                  }
                }}
                aria-label={`Archive ${c.name}`}
                className="rounded-lg p-1.5 text-muted hover:text-negative"
              >
                <Archive size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderGroup(title: string, list: Category[]) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted">{title}</h3>
        {list.length === 0 ? (
          <p className="py-2 text-sm text-muted">No categories yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {list.map((c) => renderRow(c))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      {/* Add */}
      <Card>
        {adding ? (
          <form onSubmit={submitAdd}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium">New category</h2>
              <button
                type="button"
                onClick={() => setAdding(false)}
                aria-label="Cancel"
                className="text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-1.5 block text-sm text-muted">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              placeholder="e.g. Coffee"
              className="mb-4 w-full rounded-xl border border-border bg-page px-3 py-2.5 text-sm outline-none focus:border-text/30"
            />

            <label className="mb-1.5 block text-sm text-muted">Type</label>
            <div className="mb-4 inline-flex rounded-xl border border-border p-1">
              {(["expense", "income"] as TxType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm capitalize transition-colors ${
                    newType === t ? "bg-text text-page" : "text-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-sm text-muted">Color</label>
            <div className="mb-5">
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-text px-4 py-2 text-sm font-medium text-page disabled:opacity-50"
            >
              Add category
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={18} /> Add category
          </button>
        )}
      </Card>

      <Card>
        <div className="grid gap-8 sm:grid-cols-2">
          {renderGroup("Income", income)}
          {renderGroup("Expense", expense)}
        </div>
      </Card>

      {archived.length > 0 && (
        <Card>
          <h3 className="mb-2 text-sm font-medium text-muted">Archived</h3>
          <div className="divide-y divide-border">
            {archived.map((c) => renderRow(c, true))}
          </div>
        </Card>
      )}
    </div>
  );
}
